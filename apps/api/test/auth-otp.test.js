const test = require('node:test');
const assert = require('node:assert/strict');
const { AuthService } = require('../dist/auth/auth.service');
const { StoreService } = require('../dist/store/store.service');

class CapturingMockOtpSender {
  constructor() {
    this.sent = [];
  }
  async send(email, code) {
    this.sent.push({ email, code });
  }
}

test('AuthService requestOtp sends OTP and validates email format', async () => {
  const store = new StoreService();
  const otpSender = new CapturingMockOtpSender();
  const authService = new AuthService(store, otpSender);

  // Rejects invalid email
  await assert.rejects(
    async () => authService.requestOtp('not-an-email'),
    /Please provide a valid email address/,
  );

  // Sends code for valid email
  const response = await authService.requestOtp('user@example.com');
  assert.equal(response.success, true);
  assert.equal(otpSender.sent.length, 1);
  assert.equal(otpSender.sent[0].email, 'user@example.com');
  assert.equal(otpSender.sent[0].code.length, 6);
});

test('AuthService requestOtp respects DEV_FIXED_OTP environment variable', async () => {
  process.env.DEV_FIXED_OTP = '999888';
  const store = new StoreService();
  const otpSender = new CapturingMockOtpSender();
  const authService = new AuthService(store, otpSender);

  await authService.requestOtp('dev@example.com');
  assert.equal(otpSender.sent[0].code, '999888');
  delete process.env.DEV_FIXED_OTP;
});

test('AuthService verifyOtp verifies code, creates new customer and returns token', async () => {
  const store = new StoreService();
  const otpSender = new CapturingMockOtpSender();
  const authService = new AuthService(store, otpSender);

  await authService.requestOtp('newuser@example.com');
  const code = otpSender.sent[0].code;

  const result = await authService.verifyOtp({
    email: 'newuser@example.com',
    code,
    name: 'New User',
    phone: '+60129998877',
  });

  assert.ok(result.token);
  assert.equal(result.customer.email, 'newuser@example.com');
  assert.equal(result.customer.name, 'New User');
  assert.equal(result.customer.emailVerified, true);

  // Verifying token returns the customer
  const verifiedCustomer = authService.verifySessionToken(result.token);
  assert.equal(verifiedCustomer.id, result.customer.id);
});

test('AuthService verifyOtp enforces attempt limits on wrong code', async () => {
  const store = new StoreService();
  const otpSender = new CapturingMockOtpSender();
  const authService = new AuthService(store, otpSender);

  await authService.requestOtp('retry@example.com');

  // Attempt 1 with wrong code
  await assert.rejects(
    async () => authService.verifyOtp({ email: 'retry@example.com', code: '000000' }),
    /Invalid verification code. 4 attempt\(s\) remaining/,
  );

  // Attempt 2, 3, 4, 5
  await assert.rejects(async () => authService.verifyOtp({ email: 'retry@example.com', code: '000000' }));
  await assert.rejects(async () => authService.verifyOtp({ email: 'retry@example.com', code: '000000' }));
  await assert.rejects(async () => authService.verifyOtp({ email: 'retry@example.com', code: '000000' }));
  await assert.rejects(async () => authService.verifyOtp({ email: 'retry@example.com', code: '000000' }));

  // Attempt 6 exceeds limit
  await assert.rejects(
    async () => authService.verifyOtp({ email: 'retry@example.com', code: '000000' }),
    /Too many invalid attempts/,
  );
});

test('AuthService verifySessionToken rejects tampered or expired tokens', () => {
  const store = new StoreService();
  const otpSender = new CapturingMockOtpSender();
  const authService = new AuthService(store, otpSender);

  const token = authService.createSessionToken('cust-001', 'ahmad.faris@email.com');
  const validCustomer = authService.verifySessionToken(token);
  assert.equal(validCustomer.id, 'cust-001');

  // Tampered token
  const tampered = token.slice(0, -3) + 'xyz';
  assert.throws(() => authService.verifySessionToken(tampered), /Invalid authentication token signature/);
});
