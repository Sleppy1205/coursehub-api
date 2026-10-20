import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from './login.dto.js';

describe('LoginDto', () => {
  it('normalizes the email and accepts valid credentials', async () => {
    const dto = plainToInstance(LoginDto, {
      email: ' Ana@Example.com ',
      password: 'practicePassword123',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.email).toBe('ana@example.com');
  });

  it('rejects malformed emails and passwords outside bcrypt limits', async () => {
    const dto = plainToInstance(LoginDto, {
      email: 'not-an-email',
      password: 'short',
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['email', 'password']),
    );
  });
});
