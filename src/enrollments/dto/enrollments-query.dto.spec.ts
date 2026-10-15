import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { EnrollmentsQueryDto } from './enrollments-query.dto.js';

describe('EnrollmentsQueryDto', () => {
  it('applies pagination defaults and transforms valid query values', async () => {
    const defaults = plainToInstance(EnrollmentsQueryDto, {});
    expect(defaults).toMatchObject({ page: 1, limit: 10 });

    const query = plainToInstance(EnrollmentsQueryDto, {
      search: 'nest',
      studentId: '2',
      courseId: '3',
      activeOnly: 'true',
      page: '2',
      limit: '5',
    });
    expect(query).toMatchObject({
      search: 'nest',
      studentId: 2,
      courseId: 3,
      activeOnly: 'true',
      page: 2,
      limit: 5,
    });
    await expect(validate(query)).resolves.toHaveLength(0);
  });

  it.each([
    { studentId: '0' },
    { studentId: '2147483648' },
    { courseId: 'not-a-number' },
    { courseId: '1.5' },
    { activeOnly: 'yes' },
    { page: '0' },
    { limit: '51' },
  ])('rejects invalid filter values: %o', async (input) => {
    const query = plainToInstance(EnrollmentsQueryDto, input);
    await expect(validate(query)).resolves.not.toHaveLength(0);
  });
});
