import { Type } from '@nestjs/common';
import { isFunction } from '@nestjs/common/utils/shared.utils';
import {
  inheritTransformationMetadata,
  inheritValidationMetadata,
} from '@nestjs/mapped-types';
import { Field } from '../decorators';
import { ClassDecoratorFactory } from '../interfaces/class-decorator-factory.interface';
import { getFieldsAndDecoratorForType } from '../schema-builder/utils/get-fields-and-decorator.util';

export function PickType<T, K extends keyof T>(
  classRef: Type<T>,
  keys: K[],
  decorator?: ClassDecoratorFactory,
): Type<Pick<T, typeof keys[number]>> {
  const { fields, decoratorFactory } = getFieldsAndDecoratorForType(classRef);

  abstract class PickObjectType {}
  decoratorFactory({ isAbstract: true })(PickObjectType);
  if (decorator) {
    decorator({ isAbstract: true })(PickObjectType);
  } else {
    decoratorFactory({ isAbstract: true })(PickObjectType);
  }

  const isInheritedPredicate = (propertyKey: string) =>
    keys.includes(propertyKey as K);
  inheritValidationMetadata(classRef, PickObjectType, isInheritedPredicate);
  inheritTransformationMetadata(classRef, PickObjectType, isInheritedPredicate);

  fields
    .filter((item) => keys.includes(item.schemaName as K))
    .forEach((item) => {
      if (isFunction(item.typeFn)) {
        /**
         * Execute type function eagarly to update the type options object (before "clone" operation)
         * when the passed function (e.g., @Field(() => Type)) lazily returns an array.
         */
        item.typeFn();
      }

      Field(item.typeFn, { ...item.options })(
        PickObjectType.prototype,
        item.name,
      );
    });
  return PickObjectType as Type<Pick<T, typeof keys[number]>>;
}
