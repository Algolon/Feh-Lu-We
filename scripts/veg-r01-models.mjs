// Geometry-only crown projections for quantitative identity checks, not review screenshots.
import { register } from 'node:module';
import { writeFileSync } from 'node:fs';
register('data:text/javascript,'+encodeURIComponent("export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith('.')&&!/\\.[cm]?[jt]s$/.test(s))return n(s+'.ts',c);throw e}}"));
const {treeModel}=await import('../src/world/woodkit.ts');
const rows=[];
for(const species of ['oak','beech','birch','pine'])for(let v=0;v<3;v++)for(const [profile,mode]of [['baseline',false],['b',true],['hybrid','outline']])for(const level of ['near','mid','far','xfar']){
 const actual=profile==='hybrid'&&level==='xfar'?'far':level;
 const m=treeModel(species,v,actual,mode),g=m.leaves,p=g.attributes.position,ix=g.index?.array??Array.from({length:p.count},(_,i)=>i);g.computeBoundingBox();
 const projections=[0,Math.PI/4,Math.PI/2,Math.PI*3/4].map(a=>Array.from(ix).flatMap(i=>[+(p.getX(i)*Math.cos(a)+p.getZ(i)*Math.sin(a)).toFixed(4),+p.getY(i).toFixed(4)]));
 rows.push({species,v,profile,level,woodTriangles:(m.wood.index?.count??m.wood.attributes.position.count)/3,leafTriangles:ix.length/3,bounds:[g.boundingBox.min.toArray(),g.boundingBox.max.toArray()],projections});m.wood.dispose();m.leaves.dispose();
}
writeFileSync(process.argv[2]??'/tmp/veg-models.json',JSON.stringify(rows));
