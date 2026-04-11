import assert from 'assert';
import { it, describe } from 'node:test';
import { Command } from '../../../src/models/Command';
import { ProgramLineInterface } from '../../../src';

describe('ProgramLineInterface', () => {
  describe('Argument validation', () => {
    // Verifica que se lance un error si un argumento no tiene descriptiveType definido
    it('Check ProgramLineInterface with argument without descriptiveType', () => {
      const command: Command = {
        name: 'test',
        arguments: [
          //@ts-ignore
          {
            required: true
          }
        ]
      };

      try {
        new ProgramLineInterface([command]);
      } catch (error) {
        assert.strictEqual((error as Error).message, 'Argument must have a descriptiveType');
      }
    });
  });

  describe('Option validation', () => {
    // Verifica que se lance un error si una opción tiene descriptiveType pero no tiene name ni shortName
    it('Check ProgramLineInterface with descriptiveType but without name or shortName', () => {
      const command: Command = {
        name: 'test',
        options: [
          {
            descriptiveType: 'path',
            required: true
          }
        ]
      };

      try {
        new ProgramLineInterface([command]);
      } catch (error) {
        assert.strictEqual(
          (error as Error).message,
          'Option must have a name or a shortName if it has a descriptiveType'
        );
      }
    });

    // Verifica que se lance un error si una opción variádica no tiene descriptiveType
    it('Check ProgramLineInterface with variadic option without descriptiveType', () => {
      const command: Command = {
        name: 'test',
        options: [
          {
            name: 'files',
            variadic: true,
            required: true
          }
        ]
      };

      try {
        new ProgramLineInterface([command]);
      } catch (error) {
        assert.strictEqual((error as Error).message, 'Option must have a descriptiveType if it is variadic');
      }
    });

    describe('Option env', () => {
      // Verifica que se use el valor de la variable de entorno cuando no se pasa la opción por CLI
      it('Should use env variable value when option is not provided', () => {
        const envVar = 'TEST_CLI_OUTPUT_' + Date.now();
        process.env[envVar] = '/tmp/output';

        const command: Command = {
          name: 'build',
          options: [
            {
              name: 'output',
              descriptiveType: 'path',
              env: envVar
            }
          ]
        };

        const program = new ProgramLineInterface([command]);
        const event = program.parse(['build']);

        assert.strictEqual(event.options.output, '/tmp/output');

        delete process.env[envVar];
      });

      // Verifica que el valor pasado por CLI tenga prioridad sobre la variable de entorno
      it('Should prefer explicit option value over env variable', () => {
        const envVar = 'TEST_CLI_OUTPUT_' + Date.now();
        process.env[envVar] = '/tmp/from-env';

        const command: Command = {
          name: 'build',
          options: [
            {
              name: 'output',
              descriptiveType: 'path',
              env: envVar
            }
          ]
        };

        const program = new ProgramLineInterface([command]);
        const event = program.parse(['build', '--output', '/tmp/from-cli']);

        assert.strictEqual(event.options.output, '/tmp/from-cli');

        delete process.env[envVar];
      });

      // Verifica que se use el valor por defecto cuando no se pasa la opción ni existe la variable de entorno
      it('Should use default value when neither option nor env variable is provided', () => {
        const envVar = 'TEST_CLI_MISSING_' + Date.now();
        delete process.env[envVar];

        const command: Command = {
          name: 'build',
          options: [
            {
              name: 'output',
              descriptiveType: 'path',
              env: envVar,
              defaultValue: '/default/path'
            }
          ]
        };

        const program = new ProgramLineInterface([command]);
        const event = program.parse(['build']);

        assert.strictEqual(event.options.output, '/default/path');
      });

      // Verifica que una opción booleana (sin descriptiveType) se resuelva como true cuando la variable de entorno está definida
      it('Should handle boolean-like env variable (option without descriptiveType)', () => {
        const envVar = 'TEST_CLI_VERBOSE_' + Date.now();
        process.env[envVar] = '1';

        const command: Command = {
          name: 'build',
          options: [
            {
              name: 'verbose',
              env: envVar
            }
          ]
        };

        const program = new ProgramLineInterface([command]);
        const event = program.parse(['build']);

        assert.strictEqual(event.options.verbose, true);

        delete process.env[envVar];
      });

      // Verifica que env funcione correctamente en opciones que también tienen shortName
      it('Should work with env on shortName option', () => {
        const envVar = 'TEST_CLI_PORT_' + Date.now();
        process.env[envVar] = '8080';

        const command: Command = {
          name: 'serve',
          options: [
            {
              shortName: 'p',
              name: 'port',
              descriptiveType: 'number',
              env: envVar
            }
          ]
        };

        const program = new ProgramLineInterface([command]);
        const event = program.parse(['serve']);

        assert.strictEqual(event.options.port, '8080');

        delete process.env[envVar];
      });
    });
  });
});
