// Rooms + portals of the estate (authored once; used for lighting relevance, room culling and the map).
// DEV-02 (LEVEL_LAYOUT v0.2 `proposal.rooms`): all 39 source room ids are kept; additive rooms are the guest WC, the
// utility, the linen, the rear nooks, the attic stair and the four attic rooms (new floor 'a'). Classification order
// is most-specific first: attic before the attic stair, the attic stair and the split north rooms before the broad
// upper rooms, the guest WC before the billiard room; utility and pantry do not overlap.
import { RoomGraph, type RoomDef, type PortalDef } from './rooms';
import { SHED, COTTAGE, COTTAGE_FLOOR, SAUNA } from './layout';

const R = (id: string, name: string, floor: RoomDef['floor'], x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, map = true): RoomDef => ({ id, name, floor, x0, x1, z0, z1, y0, y1, map });
const G0 = -0.5, G1 = 3.2, U0 = 3.2, U1 = 6.4, B0 = -3.7, B1 = -0.2, A0 = 6.55, A1 = 9.8;

export const ROOMS: RoomDef[] = [
  // ---------------------------------------------------------------- attic (v0.2 A01–A04; highest, listed first)
  R('atticLanding', 'Zolderoverloop', 'a', 95, 99, 98.6, 105.6, A0, A1),
  R('atticCommon', 'Weekendzolder', 'a', 80, 95, 92, 104, A0, A1),
  R('atticStore', 'Seizoensopslag', 'a', 80, 95, 86, 92, A0, A1),
  R('atticLookout', 'Kijkhoek', 'a', 95, 101, 92, 98.6, A0, A1),
  // ---------------------------------------------------------------- upstairs (listed before the ground floor: more specific in height)
  R('atticStair', 'Zoldertrap', 'u', 95, 99, 98.6, 105.6, U0, A0),
  R('rearNookEast', 'Zitnis', 'u', 95, 99, 105.6, 109.6, U0, U1),
  R('rearNook', 'Achteroverloop', 'u', 90, 95, 104, 109.6, U0, U1),
  R('linen', 'Linnenkast', 'u', 99, 107.6, 106.6, 109.6, U0, U1),
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
  R('storage', 'Noordgastenkamer', 'u', 99, 107.6, 98.6, 106.6, U0, U1), // source id kept (door.storage)
  // ---------------------------------------------------------------- ground floor
  R('vestibule', 'Vestibule', 'g', 85, 95, 80.4, 84, G0, G1),
  R('bstair', 'Keldertrap', 'g', 92, 95, 98, 104.8, B0, G1),
  R('hall', 'Hal', 'g', 85, 95, 84, 98, G0, U1),
  R('lobby', 'Achterhal', 'g', 85, 92, 98, 104, G0, G1),
  R('guestWC', 'WC', 'g', 85, 88, 104, 107, G0, G1),
  R('billiard', 'Biljartkamer', 'g', 85, 95, 104, 109.6, G0, G1),
  R('living', 'Woonkamer', 'g', 72.4, 85, 80.4, 94, G0, G1),
  R('library', 'Bibliotheek', 'g', 72.4, 85, 94, 109.6, G0, U1),
  R('dining', 'Eetkamer', 'g', 95, 107.6, 80.4, 92, G0, G1),
  R('kitchen', 'Keuken', 'g', 95, 107.6, 92, 109.6, G0, G1),
  R('corridor', 'Dienstgang', 'g', 108.4, 115.6, 101, 104, G0, G1),
  R('workshop', 'Werkplaats', 'g', 108.4, 115.6, 92.4, 101, G0, G1),
  R('pantry', 'Provisiekamer', 'g', 108.4, 113.3, 104, 109.6, G0, G1),
  R('utility', 'Bijkeuken', 'g', 113.3, 115.6, 104, 109.6, G0, G1),
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
  R('sauna', 'Sauna', 'x', SAUNA.x0, SAUNA.x1, SAUNA.z0, SAUNA.z1, G0, 4.2, false),
  R('shed', 'Schuur', 'x', SHED.x0, SHED.x1, SHED.z0, SHED.z1, G0, 3, false),
  // the Portugal cottage on its plateau (floor +4.15): the same 10 × 8 m house, moved (v0.2 COTTAGE)
  R('cottageEntry', 'Huisje', 'x', COTTAGE.x0 + 0.3, COTTAGE.x1 - 0.3, COTTAGE.z0 + 0.3, COTTAGE.z0 + 3, COTTAGE_FLOOR - 0.2, COTTAGE_FLOOR + 3.1, false),
  R('cottageRoom', 'Huisje · zaal', 'x', COTTAGE.x0 + 0.3, COTTAGE.x1 - 0.3, COTTAGE.z0 + 3, COTTAGE.z1 - 0.3, COTTAGE_FLOOR - 0.2, COTTAGE_FLOOR + 3.1, false),
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
  // ---------------------------------------------------------------- DEV-02 additive portals (v0.2 adjacency)
  P('lobby', 'guestWC', 'door', 'door.guestWC'), P('corridor', 'utility', 'door', 'door.utility'),
  P('ucorr', 'atticStair', 'door', 'door.atticStair'), P('rearNookEast', 'linen', 'door', 'door.linen'),
  P('landing', 'rearNook', 'arch'), P('rearNook', 'rearNookEast', 'arch'), P('rearNookEast', 'atticStair', 'door', 'door.atticRear'),
  P('atticStair', 'atticLanding', 'stair'), P('atticLanding', 'atticCommon', 'arch'), P('atticCommon', 'atticStore', 'door', 'door.atticStore'),
  P('atticCommon', 'atticLookout', 'arch'), P('atticLookout', 'atticLanding', 'arch'),
  P('rearNook', 'out', 'window'), P('rearNookEast', 'out', 'window'), P('linen', 'out', 'window'),
];

/** The 39 room ids of the iteration-3 source (ef6b7c3); v0.2 keeps every one of them (unit-tested). */
export const SOURCE_ROOM_IDS = ['frontGallery', 'walkway', 'landing', 'libGallery', 'reis', 'sterren', 'bath', 'ucorr', 'study', 'botanic', 'storage',
  'vestibule', 'bstair', 'hall', 'lobby', 'billiard', 'living', 'library', 'dining', 'kitchen', 'corridor', 'workshop', 'pantry', 'cons',
  'bLobby', 'archive', 'boiler', 'route', 'tunnel2', 'tunnel', 'hut', 'descent', 'entry', 'passage', 'gathering', 'sauna', 'shed', 'cottageEntry', 'cottageRoom'];

export function estateRooms() {
  return new RoomGraph(ROOMS, PORTALS);
}
