

function Title({ text }) {
  return <>
    <h1 text-xl bg-blue={text=="blue"} disabled color-red >{text}</h1>
  </>
}