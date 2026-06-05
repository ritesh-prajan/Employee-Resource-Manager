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
        border-[#C9D0F3]
        bg-[#E4E7F7]
        text-[12px]
        font-bold
        text-[#0010AE]
      "
    >
      {initials}
    </div>
  );
}