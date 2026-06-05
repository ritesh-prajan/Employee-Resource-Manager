export default function UserAvatar({ name }) {
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="
        flex
        h-8
        w-8
        items-center
        justify-center
        rounded-full
        border
        border-indigo-200
        bg-indigo-50
        text-[12px]
        font-semibold
        text-indigo-700
        shrink-0
      "
    >
      {initials}
    </div>
  );
}