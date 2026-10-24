import { useEffect, useState } from "react"

const ARQ_CROPS = "magic_garden_crops.json"
const ARQ_MULT = "magic_garden_multipliers.json"
const MUTACOES = ["Base", "Golden", "Rainbow"]

async function carregar(arquivo) {
  const resp = await fetch(`${import.meta.env.BASE_URL}dados/${arquivo}`)
  if (!resp.ok) throw new Error(`Não foi possível carregar ${arquivo}`)
  const texto = await resp.text()
  try {
    return JSON.parse(texto)
  } catch {
    throw new Error(`"${arquivo}" não existe em public/dados/ ou não é um JSON válido`)
  }
}

const dinheiro = (v) =>
  "$" + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const numero = (v) =>
  v.toLocaleString("pt-BR", { maximumFractionDigits: 3 })

export default function App() {
  const [crops, setCrops] = useState([])
  const [mults, setMults] = useState([])
  const [erro, setErro] = useState(null)

  const [cropIdx, setCropIdx] = useState(0)
  const [weight, setWeight] = useState(0)
  const [condIdx, setCondIdx] = useState(0)
  const [mutacao, setMutacao] = useState("Base")

  useEffect(() => {
    Promise.all([carregar(ARQ_CROPS), carregar(ARQ_MULT)])
      .then(([c, m]) => {
        setCrops(c)
        setMults(m)
        if (c.length) setWeight(Number(c[0].Base_Weight_kg))
      })
      .catch((e) => setErro(e.message))
  }, [])

  if (erro) return <div className="app"><p className="erro">{erro}</p></div>
  if (!crops.length || !mults.length) return <div className="app"><p className="contagem">Carregando…</p></div>

  const crop = crops[cropIdx]
  const cond = mults[condIdx]

  const precoBase = Number(crop.Base_Sell_price)
  const pesoMin = Number(crop.Base_Weight_kg)
  const pesoMax = Number(crop.Max_Weight_kg)
  const multiplicador = Number(cond[mutacao])

  // garante que o peso nunca saia do intervalo permitido
  const pesoValido = Math.min(pesoMax, Math.max(pesoMin, weight))
  const total = precoBase * (pesoValido / pesoMin) * multiplicador

  function escolherCrop(i) {
    setCropIdx(i)
    setWeight(Number(crops[i].Base_Weight_kg)) // volta para o peso mínimo da nova planta
  }

  function digitarPeso(texto) {
    const n = parseFloat(texto.replace(",", "."))
    if (!Number.isNaN(n)) setWeight(n)
  }

  return (
    <div className="app">
      <h1>Magic Garden Crop Value Calculator (solo play)</h1>

      <div className="calc">
        <div className="campos">
          <label className="campo">
            <span>Crop</span>
            <select value={cropIdx} onChange={(e) => escolherCrop(Number(e.target.value))}>
              {crops.map((c, i) => (
                <option key={i} value={i}>{c.Crop_name}</option>
              ))}
            </select>
            <small>Base sell-price: {dinheiro(precoBase)}</small>
          </label>

          <label className="campo">
            <span>Condition</span>
            <select value={condIdx} onChange={(e) => setCondIdx(Number(e.target.value))}>
              {mults.map((m, i) => (
                <option key={i} value={i}>{m.Condition}</option>
              ))}
            </select>
          </label>

          <label className="campo">
            <span>Mutation</span>
            <select value={mutacao} onChange={(e) => setMutacao(e.target.value)}>
              {MUTACOES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <small>Multipler: ×{numero(multiplicador)}</small>
          </label>
        </div>

        <div className="campo peso">
          <div className="peso-topo">
            <span>Weight</span>
            <div className="peso-valor">
              <input
                type="number"
                min={pesoMin}
                max={pesoMax}
                step="any"
                value={pesoValido}
                onChange={(e) => digitarPeso(e.target.value)}
                onBlur={() => setWeight(pesoValido)}
              />
              <em>kg</em>
            </div>
          </div>
          <input
            type="range"
            min={pesoMin}
            max={pesoMax}
            step="any"
            value={pesoValido}
            onChange={(e) => setWeight(Number(e.target.value))}
          />
          <div className="limites">
            <small>min. {numero(pesoMin)} kg</small>
            <small>Max size {numero(pesoMax)} kg</small>
          </div>
        </div>

        <div className="resultado">
          <p className="rotulo">Sell value</p>
          <p className="valor">{dinheiro(total)}</p>
          <p className="formula">
            {dinheiro(precoBase)} × {numero(pesoValido)} kg × {numero(multiplicador)}
          </p>
        </div>
      </div>
    </div>
  )
}
