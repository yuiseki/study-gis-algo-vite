import { LabList } from "../labs";

export const LabSelector: React.FC<{
  onLabSelect?: (labIndex: string) => void;
}> = ({ onLabSelect }) => {
  return (
    <div
      style={{ width: "100vw", height: "4vh", borderBottom: "1px solid #ccc" }}
    >
      <ul>
        {LabList.map((lab) => (
          <li key={lab.uniqueId}>
            <span onClick={() => onLabSelect && onLabSelect(lab.uniqueId)}>
              {lab.meta.title}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
