// src/common/decorators/one-of.decorator.ts
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidateBy,
} from 'class-validator';

type OneOfOptions = {
  properties: string[];
  allowAllEmpty?: boolean;
};
//FIXME Tengo que arreglar el decorador para que solo imprima un mensaje
/*
  Ya que a la entrada de:
  {
    "username": "UsuarioEjemplo12",
    "plainCipherPassword": "JArYU5DEjWdZI9OR2lOeAA==",
    "firstName": "Carlos",
    "lastName": "Perez",
    "email": "jdoe@corp.com",
    "isActive": true,
    "rolesNames": [
        "superadmin"
    ],
    "structureIds": [
        "091b6611-0cc1-4198-8466-c8f44c0133b6"
    ],
    "structureNames": [
        "Xetid"
    ]
} 
    Imprime dos veces la salida
    {
    "message": [
        "Solo puede existir una de las propiedades: structureNames, structureIds",
        "Solo puede existir una de las propiedades: structureNames, structureIds"
    ],
    "error": "Bad Request",
    "statusCode": 400
}
 */
export function OneOf(
  options: OneOfOptions,
  validationOptions?: ValidationOptions,
) {
  return function (target: Function) {
    const { properties, allowAllEmpty = true } = options;

    properties.forEach((property) => {
      registerDecorator({
        name: 'OneOf',
        target: target as any,
        propertyName: property,
        constraints: [properties, allowAllEmpty],
        options: validationOptions,
        validator: {
          validate(value: any, args: ValidationArguments) {
            const [siblings, allowEmpty] = args.constraints;
            const values = siblings.map((p: string) => (args.object as any)[p]);

            const filled = values.filter((v) => v !== undefined && v !== null);
            if (filled.length > 1) return false;
            if (!allowEmpty && filled.length === 0) return false;
            return true;
          },
          defaultMessage(args?: ValidationArguments) {
            const siblings = args?.constraints?.[0] as string[] | undefined;
            return `Solo puede existir una de las propiedades: ${
              siblings?.join(', ') ?? ''
            }`;
          },
        },
      });
    });
  };
}
