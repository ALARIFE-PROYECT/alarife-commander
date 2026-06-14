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

  describe('configOptions', () => {
    // Verifica que las opciones con nombre simple aparezcan en configOptions con su nombre literal
    it('Should expose simple option name in configOptions', () => {
      const command: Command = {
        name: 'build',
        options: [
          {
            name: 'output',
            descriptiveType: 'path'
          }
        ]
      };

      const program = new ProgramLineInterface([command]);
      const event = program.parse(['build', '--output', '/tmp/out']);

      assert.strictEqual(event.options.output, '/tmp/out');
      assert.strictEqual(event.configOptions.output, '/tmp/out');
    });

    // Verifica que un nombre con guiones se mantenga literal en configOptions y en camelCase en options
    it('Should keep literal kebab-case key in configOptions and camelCase in options', () => {
      const command: Command = {
        name: 'build',
        options: [
          {
            name: 'value-test',
            descriptiveType: 'string'
          }
        ]
      };

      const program = new ProgramLineInterface([command]);
      const event = program.parse(['build', '--value-test', 'hello']);

      assert.strictEqual(event.options.valueTest, 'hello');
      assert.strictEqual(event.configOptions['value-test'], 'hello');
      assert.strictEqual(event.configOptions.valueTest, undefined);
    });

    // Verifica que los valores numéricos (como string) se copien tal cual a configOptions
    it('Should copy numeric-like value as-is into configOptions', () => {
      const command: Command = {
        name: 'serve',
        options: [
          {
            name: 'port',
            descriptiveType: 'number'
          }
        ]
      };

      const program = new ProgramLineInterface([command]);
      const event = program.parse(['serve', '--port', '8080']);

      assert.strictEqual(event.options.port, '8080');
      assert.strictEqual(event.configOptions.port, '8080');
    });

    // Verifica que un flag booleano simple se mantenga sin invertir en configOptions
    it('Should keep boolean flag value unchanged in configOptions', () => {
      const command: Command = {
        name: 'build',
        options: [
          {
            name: 'verbose'
          }
        ]
      };

      const program = new ProgramLineInterface([command]);
      const event = program.parse(['build', '--verbose']);

      assert.strictEqual(event.options.verbose, true);
      assert.strictEqual(event.configOptions.verbose, true);
    });

    // Verifica que un flag negable (no-xxx) se invierta en configOptions
    it('Should invert boolean value for no-prefixed flags when flag is passed', () => {
      const command: Command = {
        name: 'build',
        options: [
          {
            name: 'no-banner'
          }
        ]
      };

      const program = new ProgramLineInterface([command]);
      const event = program.parse(['build', '--no-banner']);

      // commander expone `banner: false` cuando se pasa `--no-banner`
      assert.strictEqual(event.options.banner, false);
      // configOptions['no-banner'] representa "se activó el flag --no-banner"
      assert.strictEqual(event.configOptions['no-banner'], true);
    });

    // Verifica que un flag negable no pasado mantenga el valor por defecto invertido
    it('Should invert default boolean for no-prefixed flag when not passed', () => {
      const command: Command = {
        name: 'build',
        options: [
          {
            name: 'no-banner'
          }
        ]
      };

      const program = new ProgramLineInterface([command]);
      const event = program.parse(['build']);

      assert.strictEqual(event.options.banner, true);
      assert.strictEqual(event.configOptions['no-banner'], false);
    });

    // Verifica que un flag negable de varias palabras (no-color-output) se mapee correctamente
    it('Should handle multi-word no-prefixed flag (no-color-output)', () => {
      const command: Command = {
        name: 'build',
        options: [
          {
            name: 'no-color-output'
          }
        ]
      };

      const program = new ProgramLineInterface([command]);
      const event = program.parse(['build', '--no-color-output']);

      assert.strictEqual(event.options.colorOutput, false);
      assert.strictEqual(event.configOptions['no-color-output'], true);
    });

    // Verifica que configOptions devuelva undefined si la opción no se pasó y no tiene default
    it('Should set undefined in configOptions when option was not provided', () => {
      const command: Command = {
        name: 'build',
        options: [
          {
            name: 'output',
            descriptiveType: 'path'
          }
        ]
      };

      const program = new ProgramLineInterface([command]);
      const event = program.parse(['build']);

      assert.ok('output' in event.configOptions);
      assert.strictEqual(event.configOptions.output, undefined);
    });

    // Verifica que se respete el defaultValue propagado a configOptions
    it('Should propagate defaultValue to configOptions', () => {
      const command: Command = {
        name: 'build',
        options: [
          {
            name: 'output',
            descriptiveType: 'path',
            defaultValue: '/default/path'
          }
        ]
      };

      const program = new ProgramLineInterface([command]);
      const event = program.parse(['build']);

      assert.strictEqual(event.options.output, '/default/path');
      assert.strictEqual(event.configOptions.output, '/default/path');
    });

    // Verifica que una opción sin name (sólo shortName) sea ignorada en configOptions
    it('Should ignore options without name in configOptions', () => {
      const command: Command = {
        name: 'build',
        options: [
          {
            shortName: 'v',
            descriptiveType: 'string'
          }
        ]
      };

      const program = new ProgramLineInterface([command]);
      const event = program.parse(['build', '-v', 'value']);

      assert.deepStrictEqual(event.configOptions, {});
    });

    // Verifica que parse sin acción definida devuelva un evento con configOptions vacío
    it('Should return empty configOptions when no command was matched', () => {
      const program = new ProgramLineInterface([]);
      const event = program.parse([]);

      assert.deepStrictEqual(event, { args: [], options: {}, configOptions: {} });
    });
  });
});
