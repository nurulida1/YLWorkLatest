import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';
import Lara from '@primeng/themes/lara';
import Material from '@primeng/themes/material';
import Nora from '@primeng/themes/nora';

const MyPreset = definePreset(getTheme(), {});

function getTheme() {
  const theme = localStorage.getItem('selectedTheme');

  switch (theme) {
    case 'aura':
      return Aura;
    case 'material':
      return Material;
    case 'lara':
      return Lara;
    case 'nora':
      return Nora;
    default:
      return Aura;
  }
}

export default MyPreset;
