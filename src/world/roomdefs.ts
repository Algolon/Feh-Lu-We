// Rooms + portals of the expanded estate (authored once; used for lighting relevance, room culling and the map).
import { RoomGraph, type RoomDef, type PortalDef } from './rooms';
import { SHED, COTTAGE } from './layout';

const R = (id: string, name: string, floor: RoomDef['floor'], x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, map = true): RoomDef => ({ id, name, floor, x0, x1, z0, z1, y0, y1, map });
const G0 = -0.5, G1 = 3.2, U0 = 3.2, U1 = 6.4, B0 = -3.7, B1 = -0.2;

export const ROOMS: RoomDef[] = [
  // ---------------------------------------------------------------- upstairs (listed first: more specific in height)
  R('frontGallery', 'Galerij', 'u', 85, 95, 80.4, 84, U0, U1),
  R('walkway', 'Galerij', 'u', 85, 86.8, 84, 95.5, U0, U1),
  R('landing', 'Overloop', 'u', 85, 95, 95.5, 104, U0, U1),
  R('libGallery', 'Bibliotheekgalerij', 'u', 72.4, 85, 94, 109.6, U0, U1),
  R('reis', 'Reiskamer', 'u', 72.4, 85, 80.4, 86.8, U0, U1),
  R('sterren', 'Sterrenkamer', 'u', 72.4, 85, 86.8, 94, U0, U1),
  R('bath', 'Badkamer', 'u', 85, 90, 104, 109.6, U0, U1),
  R('ucorr', 'Gang boven', 'u', 95, 107.6, 96, 98.6, U0, U1),
  R('study', 'Studeerkamer', 'u', 95, 101.3, 80.4, 96, U0, U1),
  R('botanic', 'Botanische kamer', 'u', 101.3, 107.6, 80.4, 96, U0, U1),
  R('storage', 'Zolderopslag', 'u', 95, 107.6, 98.6, 109.6, U0, U1),
  // ---------------------------------------------------------------- ground floor
  R('vestibule', 'Vestibule', 'g', 85, 95, 80.4, 84, G0, G1),
  R('bstair', 'Keldertrap', 'g', 92, 95, 98, 104.8, B0, G1),
  R('hall', 'Hal', 'g', 85, 95, 84, 98, G0, U1),
  R('lobby', 'Achterhal', 'g', 85, 92, 98, 104, G0, G1),
  R('billiard', 'Biljartkamer', 'g', 85, 95, 104, 109.6, G0, G1),
  R('living', 'Woonkamer', 'g', 72.4, 85, 80.4, 94, G0, G1),
  R('library', 'Bibliotheek', 'g', 72.4, 85, 94, 109.6, G0, U1),
  R('dining', 'Eetkamer', 'g', 95, 107.6, 80.4, 92, G0, G1),
  R('kitchen', 'Keuken', 'g', 95, 107.6, 92, 109.6, G0, G1),
  R('corridor', 'Dienstgang', 'g', 108.4, 115.6, 101, 104, G0, G1),
  R('workshop', 'Werkplaats', 'g', 108.4, 115.6, 92.4, 101, G0, G1),
  R('pantry', 'Provisiekamer', 'g', 108.4, 115.6, 104, 109.6, G0, G1),
  R('cons', 'Serre', 'g', 116, 130, 94, 112, -3, 6.5),
  // ---------------------------------------------------------------- manor basement
  R('bLobby', 'Kelderportaal', 'b', 89, 97, 104.8, 109.6, B0, B1),
  R('archive', 'Archiefkelder', 'b', 76, 89, 100, 109.6, B0, B1),
  R('boiler', 'Ketelkamer', 'b', 97, 107.6, 100, 109.6, B0, B1),
  R('route', 'Routekamer', 'b', 77, 89, 90, 100, B0, B1),
  R('tunnel2', 'Oude gang', 'b', 62, 77, 95.9, 98.1, -3.9, B1),
  R('tunnel', 'Oude gang', 'b', 61.9, 64.1, 57, 98, -3.9, B1),
  // ---------------------------------------------------------------- BOSLUST (under the hill)
  R('hut', 'BOSLUST', 'x', 60.4, 65.6, 18.2, 20, G0, 3.2, false),
  R('descent', 'Trap onder de heuvel', 'b', 61.7, 64.3, 20, 26, -3.9, 3.2),
  R('entry', 'Ontvangstkelder', 'b', 58, 68, 26, 33, -3.9, -0.2),
  R('passage', 'Wortelgang', 'b', 61, 65, 33, 45, -3.9, -0.2),
  R('gathering', 'Verzamelzaal', 'b', 55, 71, 45, 57, -3.9, -0.2),
  // ---------------------------------------------------------------- other buildings
  R('sauna', 'Sauna', 'x', 132, 136, 100, 104, G0, 4.2, false),
  R('shed', 'Schuur', 'x', SHED.x0, SHED.x1, SHED.z0, SHED.z1, G0, 3, false),
  R('cottageEntry', 'Huisje', 'x', COTTAGE.x0 + 0.3, COTTAGE.x1 - 0.3, COTTAGE.z0 + 0.3, COTTAGE.z0 + 3, G0, 3.1, false),
  R('cottageRoom', 'Huisje · zaal', 'x', COTTAGE.x0 + 0.3, COTTAGE.x1 - 0.3, COTTAGE.z0 + 3, COTTAGE.z1 - 0.3, G0, 3.1, false),
];

const P = (a: string, b: string, kind: PortalDef['kind'], door?: string): PortalDef => ({ a, b, kind, door });
export const PORTALS: PortalDef[] = [
  P('vestibule', 'out', 'door', 'door.front'), P('vestibule', 'hall', 'arch'),
  P('hall', 'living', 'arch'), P('hall', 'dining', 'arch'), P('hall', 'lobby', 'arch'), P('hall', 'landing', 'stair'),
  P('hall', 'frontGallery', 'arch'), P('hall', 'walkway', 'arch'),
  P('lobby', 'library', 'door', 'door.library'), P('lobby', 'billiard', 'door', 'door.billiard'), P('lobby', 'bstair', 'door', 'door.basement'),
  P('bstair', 'bLobby', 'arch'),
  P('living', 'library', 'door', 'door.livLib'), P('dining', 'kitchen', 'arch'),
  P('kitchen', 'corridor', 'door', 'door.service'), P('corridor', 'workshop', 'door', 'door.workshop'), P('corridor', 'pantry', 'door', 'door.pantry'),
  P('corridor', 'cons', 'door', 'door.consWest'), P('workshop', 'out', 'door', 'door.workshopOut'),
  P('billiard', 'out', 'door', 'door.billiardOut'), P('kitchen', 'out', 'door', 'door.kitchenBack'),
  P('cons', 'out', 'door', 'door.consEast'), P('cons', 'out', 'glass'),
  P('frontGallery', 'walkway', 'arch'), P('walkway', 'landing', 'arch'),
  P('frontGallery', 'reis', 'door', 'door.reis'), P('walkway', 'sterren', 'door', 'door.sterren'),
  P('landing', 'libGallery', 'door', 'door.libGallery'), P('libGallery', 'library', 'arch'),
  P('landing', 'bath', 'door', 'door.bath'), P('landing', 'ucorr', 'arch'),
  P('ucorr', 'study', 'door', 'door.study'), P('ucorr', 'botanic', 'door', 'door.botanic'), P('ucorr', 'storage', 'door', 'door.storage'),
  P('bLobby', 'archive', 'arch'), P('bLobby', 'boiler', 'arch'), P('archive', 'route', 'arch'),
  P('route', 'tunnel2', 'door', 'door.tunnelManor'), P('tunnel2', 'tunnel', 'arch'), P('tunnel', 'gathering', 'door', 'door.tunnelGathering'),
  P('gathering', 'passage', 'door', 'door.gathering'), P('passage', 'entry', 'arch'), P('entry', 'descent', 'arch'),
  P('descent', 'hut', 'arch'), P('hut', 'out', 'door', 'door.boslust'),
  P('sauna', 'out', 'door', 'door.sauna'), P('shed', 'out', 'door', 'door.shed'),
  P('cottageEntry', 'out', 'door', 'door.cottage'), P('cottageEntry', 'cottageRoom', 'arch'),
  ...['living', 'dining', 'kitchen', 'billiard', 'library', 'workshop', 'pantry', 'vestibule', 'reis', 'sterren', 'study', 'botanic', 'bath', 'storage', 'landing', 'frontGallery', 'libGallery', 'cottageEntry', 'cottageRoom']
    .map((r) => P(r, 'out', 'window')),
];

export function estateRooms() {
  return new RoomGraph(ROOMS, PORTALS);
}
