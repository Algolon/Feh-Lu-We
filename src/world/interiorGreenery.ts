// Room-by-room planting composition. Preferred anchors are authored; local fitting respects existing geometry.
import type { World } from '../interactions/world';
import type { Ctx } from './arch';
import { ROOMS } from './roomdefs';
import { openingRegistry, type DoorSweep } from './openings';
import type { Collider } from '../player/collision';
import { addIndoorPlant, type IndoorFamily, type ContainerStyle } from './indoorPlants';
import { INTERIOR_GREEN } from './gardenkit';

interface Brief { room:string;x:number;z:number;family:IndoorFamily;scale:number;style:ContainerStyle;reason:string;group?:boolean;hang?:boolean }
const B=(room:string,x:number,z:number,family:IndoorFamily,scale:number,style:ContainerStyle,reason:string,group=false,hang=false):Brief=>({room,x,z,family,scale,style,reason,group,hang});
export const GREEN_BRIEFS:Brief[]=[
  B('vestibule',93.9,83.0,'zz',.70,'ceramic','Rustig groen naast de entree; de centrale doorgang blijft open.'),
  B('entryExtension',87.2,79.0,'snake',.47,'ceramic','Kleine hoekplant links van de nieuwe ontvangstzone, vrij van de centrale entreeas.'),
  B('frontGalleryExt',87.2,77.9,'zz',.42,'ceramic','Klein bladaccent aan de zuidwestelijke galerijrand, buiten het gereserveerde biljartvlak.'),
  B('hall',94.0,94.8,'ficus',1.25,'stand','Een hoog groen anker aan de rand van de dubbelhoge hal.'),
  B('living',73.3,81.4,'alocasia',1.15,'wicker','Bladvolume bij het raam als tegenwicht voor de zithoek.',true),
  B('library',73.3,108.6,'zz',1.05,'ceramic','Donker glanzend blad bij het leeslicht, los van de catalogus.'),
  B('dining',106.5,81.4,'ficus',1.25,'stand','Verticale raamgroep buiten de ruimte rond de eettafel.',true),
  B('kitchen',106.5,108.5,'succulent',.72,'clay','Compact groen bij het tuinlicht, weg van eiland en dienstruik.'),
  B('lobby',85.9,102.9,'snake',.78,'wicker','Smalle bladvorm aan de rand van de achterhal.'),
  B('billiard',94.0,108.6,'zz',.90,'ceramic','Groen in een hoek; speelruimte rond het biljart vrij.'),
  B('guestWC',85.7,106.3,'zz',.44,'ceramic','Klein rustig accent naast de wand, buiten deur en sanitair.'),
  B('corridor',114.7,103.2,'snake',.56,'clay','Smal silhouet aan het einde van de dienstgang.'),
  B('workshop',114.6,93.4,'cactus',.73,'clay','Robuuste compacte pot bij het raam, werkvlak vrij.'),
  B('pantry',109.0,108.6,'zz',.56,'clay','Bescheiden groen bij het raam, los van voorraadrekken.'),
  B('utility',114.9,108.7,'snake',.44,'ceramic','Compact verticaal groen, ruimte rond het werkgebied.'),
  B('cons',117.0,109.9,'alocasia',1.1,'wicker','Breder tropisch blad op de droge raamrand.',true),
  B('reis',83.8,81.4,'snake',1.0,'wicker','Warm gevlochten materiaal en een slanke raamplant.',true),
  B('sterren',73.4,92.8,'ficus',.95,'ceramic','Diepgroen blad bij het westlicht; telescoop en bed vrij.'),
  B('study',96.0,81.4,'zz',.95,'stand','Rustige structuur bij het raam, buiten het bureau met de puzzel.'),
  B('botanic',106.6,82.0,'alocasia',1.2,'wicker','Een groot blad als focus naast de bestaande verzameling.',true),
  B('storage',106.5,105.4,'ficus',1.0,'ceramic','Een raamhoek geeft de noordgastenkamer een bewoond karakter.'),
  B('bath',88.8,108.5,'pothos',.70,'ceramic','Eén hangplant voor een zachte lijn bij het raam.',false,true),
  B('linen',106.6,108.7,'zz',.40,'clay','Klein accent aan de raamzijde, zonder de rekken te vullen.'),
  B('frontGallery',94.1,81.1,'snake',.65,'ceramic','Smalle plant bij het galerijraam; bank en kunst blijven leesbaar.'),
  B('walkway',85.8,93.9,'zz',.44,'ceramic','Compacte hoekplant buiten het midden van de loopstrook.'),
  B('landing',94.0,102.9,'ficus',.85,'clay','Verticale overgang tussen galerij en achteroverloop.'),
  B('libGallery',73.3,108.6,'snake',.78,'wicker','Een smalle plant naast de leesgalerij.'),
  B('ucorr',106.6,97.5,'zz',.45,'ceramic','Klein groen aan het eind van de gang, buiten alle deurzwaaien.'),
  B('rearNook',90.8,105.0,'succulent',.58,'clay','Laag groen bij de zitnis, zicht op de kunst behouden.'),
  B('rearNookEast',98.1,108.6,'zz',.56,'ceramic','Een groen accent naast de bank, deur naar linnen vrij.'),
  B('atticLanding',98.1,104.6,'snake',.54,'clay','Smal groen buiten het trapgat en de aankomstlijn.'),
  B('atticCommon',81.1,102.8,'ficus',1.0,'wicker','Een grotere groene hoek bij het daglicht van de weekendzolder.',true),
  B('atticStore',81.1,87.1,'zz',.55,'clay','Een klein accent aan de rand van de opslag.'),
  B('atticLookout',102.5,94.4,'succulent',.70,'ceramic','Lage plant bij de kijkhoek, uitzicht en telescoop vrij.'),
  B('bLobby',96.1,108.6,'zz',.50,'clay','Een bescheiden groene pot bij het bestaande werklicht.'),
  B('archive',77.0,108.6,'zz',.50,'clay','Compact groen bij de ingangszijde, buiten archief- en puzzelwerk.'),
  B('boiler',98.0,100.9,'zz',.45,'clay','Ver van ketel en leidingen, in de rustige diensthoek.'),
  B('route',78.0,91.0,'zz',.45,'clay','Klein groenaccent buiten het puzzelvlak.'),
  B('cottageEntry',21.0,159.0,'snake',.9,'clay','Warm terracotta bij het raam van het Portugese huisje.'),
  B('cottageRoom',21.1,161.1,'alocasia',1.0,'wicker','Een raamgroep naast de zaal, buiten de tafelopstelling.',true),
];
export interface GreenPlacement {room:string;x:number;z:number;y:number;family:IndoorFamily;variant:number;scale:number;style:ContainerStyle;hang?:number;reason:string;chunk:string}
export function greenPointClear(x:number,z:number,y:number,radius:number,height:number,colliders:readonly Collider[],sweeps:readonly DoorSweep[]) {
  for(const s of sweeps)if(y<s.y1&&y+height>s.y0&&x+radius>s.x0-.18&&x-radius<s.x1+.18&&z+radius>s.z0-.18&&z-radius<s.z1+.18)return false;
  for(const c of colliders){
    if(!c.enabled||!c.solid||c.maxY<=y+.025||c.minY>=y+height)continue;
    if(c.kind==='circle'&&Math.hypot(x-c.x,z-c.z)<radius+c.r+.05)return false;
    if(c.kind==='box'){
      const nx=Math.max(c.minX,Math.min(c.maxX,x)),nz=Math.max(c.minZ,Math.min(c.maxZ,z));if(Math.hypot(x-nx,z-nz)<radius+.045)return false;
    }
    if(c.kind==='ellipse'&&((x-c.x)/(c.rx+radius))**2+((z-c.z)/(c.rz+radius))**2<1)return false;
  }return true;
}
export function buildInteriorGreenery(w:World,c:Ctx) {
  if(!INTERIOR_GREEN)return;
  const placements:GreenPlacement[]=[],missing:string[]=[],sweeps=openingRegistry().sweeps;
  for(const [index,brief] of GREEN_BRIEFS.entries()){
    const room=ROOMS.find(r=>r.id===brief.room)!;const floor=room.floor==='a'?6.65:room.floor==='u'?3.35:room.floor==='b'?-3.2:brief.room.startsWith('cottage')?4.15:.15;
    const candidates:[[number,number]]|[number,number][]=[[brief.x,brief.z]];
    // Prefer the authored window/furniture anchor, then move locally, then along that room's perimeter.
    for(const [dx,dz] of [[.5,0],[-.5,0],[0,.5],[0,-.5],[.6,.6],[-.6,-.6]])candidates.push([brief.x+dx,brief.z+dz]);
    for(let x=room.x0+.65;x<room.x1-.5;x+=.65)for(const z of [room.z0+.65,room.z1-.65])candidates.push([x,z]);
    for(let z=room.z0+.65;z<room.z1-.5;z+=.65)for(const x of [room.x0+.65,room.x1-.65])candidates.push([x,z]);
    let chosen:GreenPlacement|undefined;
    for(const scale of [brief.scale,brief.scale*.75,Math.min(.38,brief.scale)]){
      const radius=(brief.family==='alocasia'?.55:.40)*scale;
      for(const [x,z] of candidates){
        const y=brief.hang?floor+2.05:floor;
        if(x-radius<room.x0+.15||x+radius>room.x1-.15||z-radius<room.z0+.15||z+radius>room.z1-.15)continue;
        if(!brief.hang&&Math.abs(w.col.supportHeight(x,z,floor,.05)-floor)>.06)continue;
        if(!greenPointClear(x,z,brief.hang?y-.8*scale:y,radius,brief.hang?1.3*scale:.9*scale,w.col.colliders,sweeps))continue;
        if(w.items.some(it=>Math.abs(it.focus.y-(floor+1.0))<1.8&&Math.hypot(it.focus.x-x,-it.focus.z-z)<radius+.65))continue;
        chosen={room:room.id,x,z,y,family:brief.family,variant:index%3,scale,style:brief.style,hang:brief.hang?floor+2.85:undefined,reason:brief.reason,chunk:`green.${room.id}`};break;
      }if(chosen)break;
    }
    if(!chosen){missing.push(room.id);continue;}
    const place=(p:GreenPlacement)=>{
      const previous=c.chunk;c.chunk=p.chunk;
      // Raised stands are genuine three-legged supports; all other floor pots sit directly on their floor.
      const potY=p.style==='stand'?p.y+.38*p.scale:p.y;
      addIndoorPlant(c,p.x,p.z,potY,p.family,p.variant,p.scale,p.style,p.hang);c.chunk=previous;
      if(!p.hang)w.col.addCircle(p.x,p.z,(p.style==='stand'?.31:.25)*p.scale,p.y,p.y+Math.max(.6,.8*p.scale),{tag:'interior-green'});
      placements.push(p);
    };
    place(chosen);
    if(brief.group){
      // Different heights, leaf shapes and containers within a coherent warm/neutral palette.
      for(const [j,family] of (['succulent','snake'] as IndoorFamily[]).entries()){
        const p={...chosen,family,variant:(chosen.variant+j+1)%3,scale:chosen.scale*(j?.53:.38),style:j?'ceramic' as const:'clay' as const,hang:undefined,x:chosen.x+(j?.62:-.58),z:chosen.z+.16};
        if(p.x<room.x0+.5||p.x>room.x1-.5||p.z<room.z0+.5||p.z>room.z1-.5)continue;
        if(Math.abs(w.col.supportHeight(p.x,p.z,floor,.05)-floor)<.06&&greenPointClear(p.x,p.z,p.y,.28*p.scale,.9*p.scale,w.col.colliders,sweeps)&&!w.items.some(it=>Math.abs(it.focus.y-floor)<2.5&&Math.hypot(it.focus.x-p.x,-it.focus.z-p.z)<.7))place(p);
      }
    }
  }
  for(const [i,x,z] of [[0,20.65,153.3],[1,29.35,154.2]]){
    const p:GreenPlacement={room:'cottageTerrace',x,z,y:6.02,family:'pothos',variant:i?2:0,scale:.72,style:i?'clay':'ceramic',hang:6.77,reason:'Hangpot aan de rand onder het afdak; entree, zitplekken en looplijn vrij.',chunk:'green.cottageTerrace'};
    const old=c.chunk;c.chunk=p.chunk;addIndoorPlant(c,x,z,p.y,p.family,p.variant,p.scale,p.style,p.hang);c.chunk=old;placements.push(p);
  }
  w.scene.userData.greeneryAudit={placements,missing,briefCount:GREEN_BRIEFS.length};
}
export function registerGreeneryRegions(w:World) {
  if(!INTERIOR_GREEN)return;for(const b of GREEN_BRIEFS)w.roomRegion([`green.${b.room}`],[b.room],Infinity,0);
  w.roomRegion(['green.cottageTerrace'],['out','cottageEntry','cottageRoom'],35);
}
