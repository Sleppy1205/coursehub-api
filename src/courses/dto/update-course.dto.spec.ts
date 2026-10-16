import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateCourseDto } from './update-course.dto.js';

describe('UpdateCourseDto', () => {
  it('accepts valid partial course updates', async () => {
    const dto = plainToInstance(UpdateCourseDto, {
      title: 'Advanced NestJS',
      level: 'advanced',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it.each([{ title: '' }, { level: 'expert' }])(
    'rejects invalid course updates: %o',
    async (input) => {
      const dto = plainToInstance(UpdateCourseDto, input);

      await expect(validate(dto)).resolves.not.toHaveLength(0);
    },
  );
});
