import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CoursesQueryDto } from './courses-query.dto.js';

describe('CoursesQueryDto', () => {
  it('applies defaults and transforms numeric and case-insensitive query values', async () => {
    const defaults = plainToInstance(CoursesQueryDto, {});
    expect(defaults).toMatchObject({
      page: 1,
      limit: 10,
      sortBy: 'id',
      order: 'ASC',
    });

    const query = plainToInstance(CoursesQueryDto, {
      page: '2',
      limit: '5',
      sortBy: 'title',
      order: 'desc',
    });

    expect(query).toMatchObject({
      page: 2,
      limit: 5,
      sortBy: 'title',
      order: 'DESC',
    });
    await expect(validate(query)).resolves.toHaveLength(0);
  });

  it.each([
    { page: '0' },
    { limit: '200' },
    { sortBy: 'createdAt' },
    { order: 'sideways' },
  ])('rejects invalid query values: %o', async (input) => {
    const query = plainToInstance(CoursesQueryDto, input);
    await expect(validate(query)).resolves.not.toHaveLength(0);
  });
});
