const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const { ForbiddenException, NotFoundException, UnauthorizedException } = require('@nestjs/common');
const { JwtStrategy } = require('../dist/auth/strategies/jwt.strategy');
const { RequestsService } = require('../dist/requests/requests.service');
const { UsersService } = require('../dist/users/users.service');
const { currentBusinessDate, validateRequestDates } = require('../dist/requests/utils/request-date.util');
const { detectDocumentMime, resolveStoredDocumentPath } = require('../dist/requests/utils/request-document.util');
const { TrackingService } = require('../dist/tracking/tracking.service');
const bcrypt = require('bcrypt');

test('la sesión usa el rol y departamento actuales de la base de datos', async () => {
  const strategy = Object.create(JwtStrategy.prototype);
  strategy.usersService = {
    findOne: async () => ({
      id: 'user-1',
      email: 'admin@example.test',
      role: { name: 'OFFICER' },
      departmentId: 'department-current',
    }),
  };

  assert.deepEqual(await strategy.validate({
    sub: 'user-1',
    email: 'old@example.test',
    role: 'ADMIN',
  }), {
    userId: 'user-1',
    email: 'admin@example.test',
    role: 'OFFICER',
    departmentId: 'department-current',
  });
});

test('una cuenta desactivada no valida un access token existente', async () => {
  const strategy = Object.create(JwtStrategy.prototype);
  strategy.usersService = {
    findOne: async () => { throw new NotFoundException('inactive'); },
  };

  await assert.rejects(
    strategy.validate({ sub: 'inactive-user', email: 'x@example.test', role: 'ADMIN' }),
    (error) => error instanceof UnauthorizedException && error.getStatus() === 401,
  );
});

test('el login rechaza cuentas con rol o departamento inactivo', async () => {
  const service = Object.create(UsersService.prototype);
  const passwordHash = await bcrypt.hash('correct-password', 4);
  service.findByEmail = async () => ({ id: 'user-1', password: passwordHash });
  service.findActiveUser = async () => { throw new NotFoundException('inactive role'); };

  assert.equal(await service.validateUser('user@example.test', 'correct-password'), null);
});

test('admin puede consultar cualquier solicitud, pero no cambiarla', () => {
  const service = Object.create(RequestsService.prototype);
  const request = { departmentId: 'department-a' };
  const admin = { userId: 'admin-1', role: 'ADMIN', departmentId: null };

  assert.doesNotThrow(() => service.assertRequestAccess(request, admin));
  assert.throws(
    () => service.assertCanOperateRequest(request, admin),
    (error) => error instanceof ForbiddenException && error.getStatus() === 403,
  );
  assert.doesNotThrow(() => service.assertCanOperateRequest(request, {
    userId: 'mayor-1', role: 'MAYOR',
  }));
});

test('funcionario y supervisor quedan limitados a su propio departamento', () => {
  const service = Object.create(RequestsService.prototype);
  const request = { departmentId: 'department-a' };
  for (const role of ['OFFICER', 'SUPERVISOR']) {
    assert.doesNotThrow(() => service.assertRequestAccess(request, {
      userId: 'staff-1', role, departmentId: 'department-a',
    }));
    assert.throws(
      () => service.assertRequestAccess(request, {
        userId: 'staff-2', role, departmentId: 'department-b',
      }),
      (error) => error instanceof ForbiddenException && error.getStatus() === 403,
    );
  }
});

test('admin no puede desactivarse desde PATCH o DELETE', async () => {
  const service = Object.create(UsersService.prototype);
  const admin = { userId: 'admin-1', role: 'ADMIN' };

  await assert.rejects(
    service.update('admin-1', { isActive: false }, admin),
    (error) => error instanceof ForbiddenException && error.getStatus() === 403,
  );
  await assert.rejects(
    service.remove('admin-1', admin),
    (error) => error instanceof ForbiddenException && error.getStatus() === 403,
  );
});

test('un usuario no administrador no puede elevarse a admin mediante PATCH', async () => {
  const service = Object.create(UsersService.prototype);
  await assert.rejects(
    service.update('user-1', { roleId: 'admin-role' }, {
      userId: 'user-1',
      role: 'OFFICER',
    }),
    (error) => error instanceof ForbiddenException && error.getStatus() === 403,
  );
});

test('el cambio administrativo conserva las relaciones de rol y departamento', async () => {
  const service = Object.create(UsersService.prototype);
  const role = { id: 'officer-role', name: 'OFFICER', isActive: true };
  const department = { id: 'department-1', name: 'Obras', isActive: true };
  const current = {
    id: 'user-1',
    firstName: 'Ana',
    lastName: 'Lopez',
    email: 'ana@example.test',
    isActive: true,
    roleId: 'admin-role',
    role: { id: 'admin-role', name: 'ADMIN', isActive: true },
    departmentId: null,
    department: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  let saved;
  service.userRepository = {
    findOne: async ({ where }) => {
      if (where.email) return null;
      return saved ?? current;
    },
    save: async (user) => { saved = { ...user }; return saved; },
  };
  service.roleRepository = {
    findOne: async ({ where }) => where.id === role.id ? role : null,
  };
  service.departmentRepository = {
    findOne: async ({ where }) => where.id === department.id ? department : null,
  };

  const result = await service.update('user-1', {
    roleId: role.id,
    departmentId: department.id,
  }, { userId: 'admin-1', role: 'ADMIN' });

  assert.equal(saved.roleId, role.id);
  assert.equal(saved.role.id, role.id);
  assert.equal(saved.departmentId, department.id);
  assert.equal(saved.department.id, department.id);
  assert.equal(result.role.name, 'OFFICER');
  assert.equal(result.department.name, 'Obras');
});

test('la reasignación devuelve el departamento guardado y registra historial atómicamente', async () => {
  const service = Object.create(RequestsService.prototype);
  const oldDepartment = { id: 'department-old', name: 'Obras antiguas' };
  const newDepartment = { id: 'department-new', name: 'Obras nuevas', isActive: true };
  const request = {
    id: 'request-1',
    departmentId: oldDepartment.id,
    department: oldDepartment,
    category: { name: 'Infraestructura' },
    status: { name: 'received' },
    userAssignedId: 'officer-old',
    userAssigned: { id: 'officer-old', firstName: 'Luis', lastName: 'Diaz' },
    receivedBy: { firstName: 'Ana', lastName: 'Lopez' },
    receivedById: 'receptionist-1',
    trackingCode: 'SA-2026-001',
    priority: 'Media',
    requestDate: '2026-09-25',
    deadline: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const updated = { ...request, departmentId: newDepartment.id, department: newDepartment, userAssignedId: null, userAssigned: null };
  let lookupCount = 0;
  const history = [];
  let committed = false;

  service.findRequestByIdOrThrow = async () => (++lookupCount === 1 ? request : updated);
  service.departmentRepository = { findOne: async () => newDepartment };
  const queryBuilder = {
    innerJoinAndSelect() { return this; },
    where() { return this; },
    andWhere() { return this; },
    orderBy() { return this; },
    getOne: async () => null,
  };
  service.userRepository = { createQueryBuilder: () => queryBuilder };
  service.requestDocumentRepository = { findOne: async () => null };
  service.requestHistoryService = {
    registerInternalObservation: async (entry) => history.push(entry),
    registerAssignment: async (entry) => history.push(entry),
  };
  service.dataSource = {
    createQueryRunner: () => ({
      connect: async () => {},
      startTransaction: async () => {},
      manager: { save: async (value) => value },
      commitTransaction: async () => { committed = true; },
      rollbackTransaction: async () => {},
      release: async () => {},
    }),
  };

  const result = await service.changeRequestDepartment('request-1', {
    departmentId: newDepartment.id,
  }, { userId: 'receptionist-1', role: 'RECEPTIONIST' });

  assert.equal(result.departmentName, newDepartment.name);
  assert.equal(request.departmentId, newDepartment.id);
  assert.equal(request.department.id, newDepartment.id);
  assert.equal(committed, true);
  assert.equal(history.length, 2);
});

test('los datos de fecha usan el día civil de Panamá y rechazan valores fuera de rango', () => {
  const today = currentBusinessDate(new Date('2026-09-26T04:30:00.000Z'));
  assert.equal(today, '2026-09-25');
  assert.doesNotThrow(() => validateRequestDates('2026-09-25', '2026-09-26', '2026-09-25'));
  assert.throws(() => validateRequestDates('2026-09-26', undefined, '2026-09-25'));
  assert.throws(() => validateRequestDates(undefined, '2026-09-24', '2026-09-25'));
  assert.throws(() => validateRequestDates('2026-02-30', undefined, '2026-09-25'));
});

test('solo acepta firmas reales de PDF e imágenes autorizadas', () => {
  assert.equal(detectDocumentMime(Buffer.from('%PDF-1.7 sample')), 'application/pdf');
  assert.equal(detectDocumentMime(Buffer.from([0xff, 0xd8, 0xff, 0x00])), 'image/jpeg');
  assert.equal(detectDocumentMime(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'image/png');
  assert.equal(detectDocumentMime(Buffer.from('RIFF0000WEBP')), 'image/webp');
  assert.equal(detectDocumentMime(Buffer.from('<html>not a pdf</html>')), undefined);
});

test('la subida persiste una referencia interna al archivo y devuelve la URL protegida', async () => {
  const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'alcaldia-document-test-'));
  const filePath = path.join(tempDirectory, 'qa-file.pdf');
  await fs.writeFile(filePath, Buffer.from('%PDF-1.7 sample'));

  try {
    const service = Object.create(RequestsService.prototype);
    service.assertCanUploadDocument = async () => {};
    let persisted;
    service.requestDocumentRepository = {
      create: (document) => ({ ...document, id: 'document-1' }),
    };
    service.dataSource = {
      createQueryRunner: () => ({
        connect: async () => {},
        startTransaction: async () => {},
        manager: { save: async (document) => { persisted = document; return document; } },
        commitTransaction: async () => {},
        rollbackTransaction: async () => {},
        release: async () => {},
      }),
    };
    service.requestHistoryService = { registerDocumentUpload: async () => {} };

    const result = await service.registerUploadedDocument({
      requestId: 'request-1',
      currentUser: { userId: 'user-1', role: 'RECEPTIONIST' },
      fileName: 'qa-file.pdf',
      fileType: 'application/pdf',
      size: Buffer.byteLength('%PDF-1.7 sample'),
      path: filePath,
    });

    assert.equal(persisted.url, '/uploads/requests/request-1/qa-file.pdf');
    assert.equal(result.url, '/api/v1/requests/request-1/documents/document-1/content');
  } finally {
    await fs.rm(tempDirectory, { recursive: true, force: true });
  }
});

test('cambiar solo el rol conserva el departamento operativo existente', async () => {
  const service = Object.create(UsersService.prototype);
  const role = { id: 'officer-role', name: 'OFFICER', isActive: true };
  const department = { id: 'department-1', name: 'Obras', isActive: true };
  const current = {
    id: 'user-1',
    firstName: 'Ana',
    lastName: 'Lopez',
    email: 'ana@example.test',
    isActive: true,
    roleId: role.id,
    role,
    departmentId: department.id,
    department,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  let saved;
  service.userRepository = {
    findOne: async ({ where }) => where.email ? null : saved ?? current,
    save: async (user) => { saved = { ...user }; return saved; },
  };
  service.roleRepository = {
    findOne: async ({ where }) => where.id === role.id ? role : null,
  };
  service.departmentRepository = {
    findOne: async ({ where }) => where.id === department.id ? department : null,
  };

  const result = await service.update('user-1', { roleId: role.id }, {
    userId: 'admin-1', role: 'ADMIN',
  });

  assert.equal(saved.departmentId, department.id);
  assert.equal(saved.department.id, department.id);
  assert.equal(result.role.name, role.name);
  assert.equal(result.department.name, department.name);
});

test('cada version del documento obtiene una URL protegida distinta', async () => {
  const service = Object.create(RequestsService.prototype);
  const request = { id: 'request-1', departmentId: 'department-1' };
  service.findRequestByIdOrThrow = async () => request;
  service.assertRequestAccess = () => {};
  service.requestDocumentRepository = {
    find: async () => [
      { id: 'document-new', fileName: 'new.pdf', fileType: 'application/pdf', size: 20, userId: 'user-1', user: { firstName: 'Ana', lastName: 'Lopez' }, createdAt: new Date() },
      { id: 'document-old', fileName: 'old.pdf', fileType: 'application/pdf', size: 10, userId: 'user-1', user: { firstName: 'Ana', lastName: 'Lopez' }, createdAt: new Date() },
    ],
  };

  const versions = await service.getRequestDocuments('request-1', {
    userId: 'officer-1', role: 'OFFICER', departmentId: 'department-1',
  });

  assert.equal(versions[0].version, 2);
  assert.equal(versions[1].version, 1);
  assert.notEqual(versions[0].url, versions[1].url);
  assert.match(versions[0].url, /document-new\/content$/);
  assert.match(versions[1].url, /document-old\/content$/);
});

test('la ruta almacenada de un documento no permite salir de su carpeta', () => {
  assert.throws(() => resolveStoredDocumentPath({
    requestId: 'request-1',
    url: '/uploads/requests/request-1/../../secrets.txt',
  }));
});

test('la búsqueda pública acepta los códigos históricos SA-2026-001', async () => {
  const service = new TrackingService(
    { findOne: async () => ({
      trackingCode: 'SA-2026-001',
      subject: 'Solicitud de prueba',
      status: { name: 'received' },
      createdAt: new Date('2026-09-01T12:00:00.000Z'),
      updatedAt: new Date('2026-09-01T12:00:00.000Z'),
    }) },
    { findLatestByRequestId: async () => null },
  );

  const result = await service.getPublicTrackingByCode(' sa-2026-001 ');
  assert.equal(result.trackingCode, 'SA-2026-001');
  assert.equal(result.subject, 'Solicitud de prueba');
});
