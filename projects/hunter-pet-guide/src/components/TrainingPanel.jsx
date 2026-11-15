/** How pet training works, for every family: learning a skill from a wild pet, then the rules of thumb. */
export default function TrainingPanel() {
  return (
    <>
      <h2>How it works</h2>
      <div className="card">
        <h3>Learning a skill from a wild pet</h3>
        <ol>
          <li>
            <b>Stable your main pet</b> at a stable master. You can only have one pet out, and you'll want it back.
          </li>
          <li>
            <b>Tame a beast that knows the rank</b> you want. The Training Plan and All Ranks tabs list which ones do; at level 24+,
            Beast Lore on a beast shows what it knows.
          </li>
          <li>
            <b>Fight with it until you get a message that you've learned the skill.</b> You only learn it when the beast
            uses it, which can take one fight or several. To speed it up, turn off its other skills (Growl too), keep
            clicking the skill, and fight very easy mobs while standing next to it. Prowl and Furious Howl can even be
            learned out of combat.
          </li>
          <li>
            <b>Abandon the tamed beast</b> (unless you want to keep it) and take your main pet back out of the stable.
          </li>
          <li>
            <b>Teach it with Beast Training</b>, the slingshot icon on the General tab of your spellbook. Pick the skill
            and press Train; it costs the pet training points (TP).
          </li>
        </ol>
        <h3>Good to know</h3>
        <ul>
          <li>
            You can tame a pet only if it is <b>at or below your level</b>.
          </li>
          <li>
            Your permanent pet must be <b>at or above the "pet lvl"</b> of a rank before you can teach it (the pet's level,
            not yours).
          </li>
          <li>
            <b>Skipping ranks is fine</b>, and upgrading refunds the TP of the lower rank, so jumping straight to a higher
            rank costs the same total as going rank by rank.
          </li>
          <li>
            A pet can know <b>up to four active skills</b> at once. Passive skills (armor, stamina, resistances) don't
            count toward that.
          </li>
          <li>
            <b>Growl</b>, <b>resistances</b>, <b>Great Stamina</b> and <b>Natural Armor</b> are bought from the pet trainer,
            not tamed.
          </li>
          <li>Level ranges like "40–41" mean the one you find might be a level above you. Tame a neighbour or gain a level.</li>
          <li>Every pet name links to its Wowhead Forever page, where you can see its spawn locations.</li>
          <li>
            The plans are generated from Petopia's data for whichever family you pick. They are a starting point, not
            hand-tuned.
          </li>
        </ul>
      </div>
      <p className="small">
        Tick boxes are saved in this browser, per family and continent; ticked skills hide until you tick "Show checked".
        Enter your hunter level at the top to hide pets you can't tame yet. Data source: wow-petopia.com/forever.
      </p>
    </>
  );
}
