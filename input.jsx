

function Title({ text }) {
  return <>
    <h1 text-xl bg-blue={text=="blue"} disabled color-red class="bg-green">{text}</h1>
  </>
}