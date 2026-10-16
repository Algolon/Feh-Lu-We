// WINDOW-R03: physically cut the ONE existing east attic observation opening through the
// exterior hip roof. Unlike facade windows, the roof is a sloped triangular surface.
import * as THREE from 'three';
export interface RoofCutout { x0:number; x1:number; z0:number; z1:number }

export function cutEastHipRoofWindow(
  src: THREE.BufferGeometry, sx:number, sz:number, h:number, overhang:number,
  cx:number, cz:number, opening: RoofCutout,
): THREE.BufferGeometry {
  const ax=sx/2+overhang, az=sz/2+overhang, ridge=ax-az;
  if (!(ridge>0 && opening.x0<opening.x1 && opening.z0<opening.z1))
    throw Error('East roof cutout requires an X-ridge hip and positive rectangle');
  // Projection from plan to Three local XY coordinates: u=three Z, v=plan X.
  // The east roof face is the triangle (u=-az,v=ax),(u=az,v=ax),(u=0,v=ridge).
  const outside=[
    new THREE.Vector2(-az,ax),new THREE.Vector2(az,ax),new THREE.Vector2(0,ridge),
  ];
  const hole=[
    new THREE.Vector2(-(opening.z1-cz),opening.x0-cx),
    new THREE.Vector2(-(opening.z1-cz),opening.x1-cx),
    new THREE.Vector2(-(opening.z0-cz),opening.x1-cx),
    new THREE.Vector2(-(opening.z0-cz),opening.x0-cx),
  ];
  const triangle=new THREE.Triangle(...outside);
  if(!hole.every(v=>triangle.containsPoint(v)))throw Error('Attic skylight exceeds east hip face');
  const pos=src.getAttribute('position'),uv=src.getAttribute('uv');
  const positions:number[]=[],uvs:number[]=[];
  let replaced=0;
  const emit=(v:THREE.Vector3, t?:[number,number])=>{
    positions.push(v.x,v.y,v.z);
    uvs.push(...(t??[(v.x+v.z)/2,v.y/1.5+(Math.abs(v.x)+Math.abs(v.z))/6]));
  };
  for(let i=0;i<pos.count;i+=3){
    const vertices=[0,1,2].map(d=>new THREE.Vector3(pos.getX(i+d),pos.getY(i+d),pos.getZ(i+d)));
    const normal=new THREE.Vector3().subVectors(vertices[1],vertices[0]).cross(new THREE.Vector3().subVectors(vertices[2],vertices[0]));
    if(vertices.every(p=>p.x>=ridge-1e-5)&&normal.x>0.1){replaced++;continue;}
    for(let j=0;j<3;j++)emit(vertices[j],uv?[uv.getX(i+j),uv.getY(i+j)]:undefined);
  }
  if(replaced!==1)throw Error('Expected exactly one east hip triangle; got '+replaced);
  const all=[...outside,...hole];
  const triangles=THREE.ShapeUtils.triangulateShape(outside,[hole]);
  if(triangles.length<4)throw Error('Roof hole triangulation failed');
  for(const indices of triangles){
    const v=indices.map(index=>{
      const p=all[index];
      return new THREE.Vector3(p.y,h*(ax-p.y)/az,p.x);
    });
    const normal=v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0]));
    for(const j of normal.x>=0?[0,1,2]:[0,2,1])emit(v[j]);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  g.computeVertexNormals();
  g.userData.roofCutout={count:1,site:'atticLookout',triangles:positions.length/9};
  return g;
}
