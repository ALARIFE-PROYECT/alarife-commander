import assert from 'assert';
import { test, describe, it } from 'node:test';

import { getBaseName, getOptionName } from '../../../src/utils/flag-name';
import { Flag, Option } from '../../../src/models/Command';

describe('flag-name', () => {
  describe('getBaseName', () => {
    // Verifica que retorne vacío si no se proporciona descriptiveType
    it('Check behavior without descriptiveType', () => {
      const flag: Partial<Flag> = {
        required: true
      };

      const baseName = getBaseName(flag);

      assert.strictEqual(baseName, '');
    });

    // Verifica que genere el nombre con <> cuando el flag es requerido
    it('Check BaseName required', () => {
      const flag: Partial<Flag> = {
        descriptiveType: 'path',
        required: true
      };

      const baseName = getBaseName(flag);

      assert.strictEqual(baseName, '<path>');
    });

    // Verifica que genere el nombre con [] cuando el flag es opcional
    it('Check BaseName optional', () => {
      const flag: Partial<Flag> = {
        descriptiveType: 'path',
        required: false
      };

      const baseName = getBaseName(flag);

      assert.strictEqual(baseName, '[path]');
    });

    // Verifica que añada puntos suspensivos al nombre cuando el flag es variádico
    it('Check BaseName with variadic', () => {
      const flag: Partial<Flag> = {
        descriptiveType: 'path',
        required: true,
        variadic: true
      };

      const baseName = getBaseName(flag);

      assert.strictEqual(baseName, '<path...>');
    });
  });

  describe('getOptionName', () => {
    // Verifica que genere el nombre con prefijo -- cuando solo tiene name
    it('Check getOptionName with only name', () => {
      const option: Partial<Option> = {
        name: 'extensions'
      };

      const optionName = getOptionName(option);

      assert.strictEqual(optionName, '--extensions');
    });

    // Verifica que combine shortName (-) y name (--) separados por coma
    it('Check getOptionName with shortName and name', () => {
      const option: Partial<Option> = {
        shortName: 'ex',
        name: 'extensions'
      };

      const optionName = getOptionName(option);

      assert.strictEqual(optionName, '-ex, --extensions');
    });

    // Verifica que required no afecte el formato del nombre de la opción
    it('Check getOptionName with shortName, name and required', () => {
      const option: Partial<Option> = {
        shortName: 'ex',
        name: 'extensions',
        required: true
      };

      const optionName = getOptionName(option);

      assert.strictEqual(optionName, '-ex, --extensions');
    });

    // Verifica que se añada el descriptiveType entre [] al final del nombre de la opción
    it('Check getOptionName with shortName, name and descriptiveType', () => {
      const option: Partial<Option> = {
        shortName: 'ex',
        name: 'extensions',
        descriptiveType: 'extensions'
      };

      const optionName = getOptionName(option);

      assert.strictEqual(optionName, '-ex, --extensions [extensions]');
    });
  });
});
