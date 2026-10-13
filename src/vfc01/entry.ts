import '../ui/style.css';
// Must run before dynamic imports of state/Game: review storage is memory-only.
const url=new URL(location.href);url.searchParams.set('review','living');history.replaceState(null,'',url);
void import('./lab').then(m=>m.boot());
