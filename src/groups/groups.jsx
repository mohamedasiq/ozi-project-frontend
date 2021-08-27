import "./groups.css";

export default function Group({grpName}) {

  return (
    <div className="groupContainer">
      <span className="groupName">{grpName}</span>
    </div>
  );
}
