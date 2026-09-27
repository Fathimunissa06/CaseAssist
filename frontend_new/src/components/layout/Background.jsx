/** Fixed color field that gives the glass surfaces something to refract. Very slow drift. */
export default function Background() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 overflow-hidden bg-ink-50 dark:bg-ink-950"
    >
      <div className="absolute -left-40 -top-48 size-[36rem] animate-drift-a rounded-full bg-verdigris-300/50 blur-3xl will-change-transform dark:bg-verdigris-600/25" />
      <div className="absolute -right-40 top-[18%] size-[32rem] animate-drift-b rounded-full bg-indigo-300/45 blur-3xl will-change-transform dark:bg-indigo-500/20" />
      <div className="absolute -bottom-52 left-[28%] size-[30rem] animate-drift-c rounded-full bg-brass-300/35 blur-3xl will-change-transform dark:bg-brass-500/[0.09]" />
    </div>
  );
}
