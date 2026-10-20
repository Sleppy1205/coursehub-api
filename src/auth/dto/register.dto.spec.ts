import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './register.dto.js';

describe('RegisterDto', () => {
  it('normalizes email while preserving the exact password value', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: ' Ana@Example.com ',
      password: ' password-with-boundary-spaces ',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.email).toBe('ana@example.com');
    expect(dto.password).toBe(' password-with-boundary-spaces ');
  });

  it('rejects malformed email and a password shorter than eight characters', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: 'not-an-email',
      password: 'short',
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['email', 'password']),
    );
  });

  it('rejects a password exceeding bcrypt’s 72-byte input limit', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: 'ana@example.com',
      password: '😀'.repeat(19),
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toContain('password');
  });
});
