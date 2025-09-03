import React from 'react'

export const LoadingLogin = ({ message }: { message: string }) => {
  return (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="flex flex-col items-center">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full animate-ping"></div>
              <div className="absolute inset-2 border-4 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-4 border-4 border-r-blue-500 border-t-transparent border-b-transparent border-l-transparent rounded-full animate-spin-slow"></div>
              <div className="absolute inset-6 border-4 border-b-purple-500 border-t-transparent border-r-transparent border-l-transparent rounded-full animate-spin-slower"></div>
            </div>
            <div className="mt-4 text-cyan-500 font-mono text-sm tracking-wider">{message}</div>
          </div>
    </div>
  )
}