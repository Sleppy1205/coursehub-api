import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateEnrollmentDto } from './create-enrollment.dto.js';

describe('CreateEnrollmentDto', () => {
  it('transforms and accepts positive integer IDs', async () => {
    const dto = plainToInstance(CreateEnrollmentDto, {
      studentId: '1',
      courseId: '2',
    });

    expect(dto).toMatchObject({ studentId: 1, courseId: 2 });
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it.each([
    { studentId: '0', courseId: '1' },
    { studentId: '1.5', courseId: '1' },
    { studentId: '2147483648', courseId: '1' },
    { studentId: '1', courseId: '2147483648' },
  ])('rejects invalid enrollment IDs: %o', async (input) => {
    const dto = plainToInstance(CreateEnrollmentDto, input);

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });
});
