import { LabList } from "../labs";

export const LabSelector: React.FC<{
  selectedLabId?: string;
  onLabSelect?: (labIndex: string) => void;
}> = ({ selectedLabId, onLabSelect }) => {
  return (
    <div
      style={{ width: "100vw", height: "4vh", borderBottom: "1px solid #ccc" }}
    >
      <ul style={{ listStyle: "none", display: "flex", gap: "10px" }}>
        {LabList.map((lab) => (
          <li key={lab.uniqueId} style={{ fontWeight: lab.uniqueId === selectedLabId ? "bold" : "normal" }}>
            <span onClick={() => onLabSelect && onLabSelect(lab.uniqueId)} style={{ cursor: "pointer" }}>
              {lab.meta.title}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
