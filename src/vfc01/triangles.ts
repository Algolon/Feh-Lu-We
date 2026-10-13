import * as T from 'three';
import type {Game} from '../core/game';
/** Constant surface, shader, coverage and one draw; varying regular tessellation only. */
export function triangleProbe(game:Game,target:number,current:number){const add=Math.max(2,Math.ceil((target-current)/2)),side=Math.ceil(Math.sqrt(add));const g=new T.PlaneGeometry(.25,.15,side,Math.max(1,Math.ceil(add/side)));const m=new T.Mesh(g,new T.MeshLambertMaterial({color:0x745b39}));m.position.set(0,-.32,-2);m.frustumCulled=false;m.name='vfc-constant-coverage-probe';game.camera.add(m);game.world!.scene.add(game.camera);return m;}
