import {defineConfig} from 'vite';
export default defineConfig({base:'/Feh-Lu-We/',define:{__BUILD__:JSON.stringify('VFC-01 recovery calibration')},build:{target:'es2022',outDir:'dist-vfc01',rolldownOptions:{input:'vfc01.html'}}});
