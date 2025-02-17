import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'


export default function HomePage() {
  const [log, setLog] = React.useState('')
  const [value, setValue] = React.useState('5')
  const [message, setMessage] = React.useState('')
  const [localConsole, setLocalConsole] = React.useState({ logs: [] }) // Modified to store array of logs

  function handleChange(event) {
    setValue(event.target.value)
    setMessage('')
  }

  React.useEffect(() => {
    window.ipc.on('log', (log) => {
      console.log('log', log)
      setLog(log)
      // Add log to console
      setLocalConsole(prev => ({
        logs: [...prev.logs, `[Log] ${log}`]
      }))
    })

    window.ipc.on('message', (msg) => {
      setMessage(msg)
      // Add message to console
      setLocalConsole(prev => ({
        logs: [...prev.logs, `[Message] ${msg}`]
      }))
    })

    window.ipc.on('logging', (logger) => {
      console.log('logger', logger)
      // Add logger message to console
      setLocalConsole(prev => ({
        logs: [...prev.logs, `[Logger] ${logger}`]
      }))
    })

    // Cleanup listeners on unmount
    return () => {
      // window.ipc.removeAllListeners('log')
      // window.ipc.removeAllListeners('message')
      // window.ipc.removeAllListeners('logger')
    }
  }, [])

  return (
    <React.Fragment>
      <Head>
        <title>Home - Nextron (basic-lang-javascript-python)</title>
      </Head>
      <div>
        <p>
          ⚡ Electron + Next.js ⚡ - <Link href="/next">Go to next page</Link>
        </p>
        <Image
          src="/images/logo.png"
          alt="Logo image"
          width={256}
          height={256}
        />
      </div>
      <div>
        <p>
          Calculate the sqaure of your number:
          <input type="number" value={value} onChange={handleChange} />
        </p>
        <button
          onClick={() => {
            window.ipc.send('update', value)
            window.ipc.send('run-sh', value)

          }}
        >
          Test running the Python script via IPC
        </button>
        <p>{log}</p>
        <p>
          the square of {value} is {'-> '} {message}
        </p>

      </div>

      <div>
    <div className="terminal">
      <h3>Console Output</h3>
      <pre>
        {localConsole.logs.join('\n')}
      </pre>
      <style jsx>{`
        .terminal {
          background: #1e1e1e;
          color: #fff;
          padding: 1rem;
          border-radius: 4px;
          margin-top: 1rem;
          max-height: 300px;
          overflow-y: auto;
        }
        pre {
          margin: 0;
          white-space: pre-wrap;
          word-wrap: break-word;
          font-family: monospace;
        }
      `}</style>
    </div>
      </div>
    </React.Fragment>
  )
}
