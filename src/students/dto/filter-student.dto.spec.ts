import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FilterStudentDto } from './filter-student.dto.js';

describe('FilterStudentDto', () => {
  it('transforms and accepts valid student filters', async () => {
    const filters = plainToInstance(FilterStudentDto, {
      career: 'Engineering',
      semester: '3',
      isActive: 'false',
    });

    expect(filters).toMatchObject({
      career: 'Engineering',
      semester: 3,
      isActive: false,
    });
    await expect(validate(filters)).resolves.toHaveLength(0);
  });

  it.each([
    { semester: '3abc' },
    { semester: '0' },
    { semester: '11' },
    { isActive: 'yes' },
  ])('rejects invalid student filters: %o', async (input) => {
    const filters = plainToInstance(FilterStudentDto, input);

    await expect(validate(filters)).resolves.not.toHaveLength(0);
  });
});
