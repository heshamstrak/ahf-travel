import { Calendar } from "lucide-react";
import { InputHTMLAttributes } from "react";
import Input from "./Input";

type DateInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  error?: string;
  hint?: string;
};

export default function DateInput(props: DateInputProps) {
  return <Input {...props} type="date" icon={<Calendar size={16} />} />;
}
