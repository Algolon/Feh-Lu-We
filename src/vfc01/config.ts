import type {PlayerPose} from '../core/state';
export const q=new URLSearchParams(location.search);
export const variant=/^V[0-4]$/.test(q.get('v')??'')?q.get('v')!:'V0';
export const materialPilot=['V1','V3','V4'].includes(variant),geometryPilot=['V2','V3','V4'].includes(variant);
export const n=(k:string,d:number,min:number,max:number)=>{const x=q.has(k)?Number(q.get(k)):d;return Number.isFinite(x)?Math.max(min,Math.min(max,x)):d;};
const D=Math.PI/180;
export const cameras:Record<string,PlayerPose>={
 'library-player':{x:83.8,y:.15,z:95.2,yaw:-40*D,pitch:.02},'library-medium':{x:83.8,y:.15,z:106.7,yaw:-140*D,pitch:-.04},'library-craft':{x:79,y:.15,z:101,yaw:-90*D,pitch:.02},
 'cottage-player':{x:19.4,y:4.1,z:152.5,yaw:72*D,pitch:.06},'cottage-medium':{x:25,y:4.15,z:146.8,yaw:0,pitch:.1},'cottage-craft':{x:25.6,y:4.15,z:153,yaw:45*D,pitch:-.05}};
export function zoneAt(x:number,y:number,z:number){if(x>72&&x<85.3&&z>94.5&&z<110&&y<6.6)return 'library';if(x>19&&x<30.8&&z>151.4&&z<165.5&&y>3.4&&y<10.5)return 'cottage';return null;}
export const objects=[{id:'stack',x:76.6,z:97.6,y:.15,sx:3.3,sz:1.05,h:2.5},{id:'north-case',x:77.9,z:109.25,y:.15,sx:2.2,sz:.9,h:3.1},{id:'reading-table',x:80.6,z:101.2,y:.15,sx:1.2,sz:2.3,h:.9},{id:'terrace-table',x:27.2,z:154.6,y:4.15,sx:2.3,sz:1.1,h:.82},{id:'post-west',x:21.6,z:152.18,y:4.15,sx:.3,sz:.3,h:2.8},{id:'post-east',x:28.4,z:152.18,y:4.15,sx:.3,sz:.3,h:2.8}];
