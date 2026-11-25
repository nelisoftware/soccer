import { cpfToScreenFormat } from './cpfToScreen';
import { firstAndLastNameFormat } from './firstAndLastName';
import { maskedCPF } from './maskedCPF';
import { maskedName } from './maskedName';
import { nameFormat } from './name';
import { normalize, normalizeLower } from './normalize';
import { onlyNumberFormat } from './onlyNumbers';
import { withoutAccentFormat } from './withoutAccent';
import { zipCodeToScreenFormat } from './zipcodeToScreen';

export const FormatHelper = {
  name: nameFormat,
  nameFirstAndLast: firstAndLastNameFormat,
  nameMasked: maskedName,
  cpfToScreen: cpfToScreenFormat,
  cpfMasked: maskedCPF,
  onlyNumbers: onlyNumberFormat,
  withoutAccent: withoutAccentFormat,
  zipcodeToSccreen: zipCodeToScreenFormat,
  normalize: normalize,
  normalizeLower: normalizeLower,
};
