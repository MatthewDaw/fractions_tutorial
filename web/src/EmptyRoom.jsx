// EmptyRoom.jsx — placeholder for a lesson that isn't built yet.
// Empty page + a back button to the kitchen map.
export default function EmptyRoom({ room, onBack }) {
  return (
    <div className="emptyroom">
      <div className="foxing" />
      <div className="er-no">№{room.no}</div>
      <div className="er-tag">Lesson {room.no}</div>
      <h1>{room.title}</h1>
      <div className="er-note">
        This room isn't built yet. Head back to Babushka's kitchen and pick a lesson that's ready.
      </div>
      <button className="backbtn" onClick={onBack}>← Back to the kitchen map</button>
    </div>
  );
}
