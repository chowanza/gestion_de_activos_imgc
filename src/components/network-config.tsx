"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { showToast } from "nextjs-toast-notify"
import { setNetworkIP } from "@/utils/qrCode"
import { Wifi, Check, X } from "lucide-react"

export function NetworkConfig() {
  const [ip, setIp] = useState("")
  const [currentIp, setCurrentIp] = useState("")

  useEffect(() => {
    // Cargar la IP actual del localStorage
    const savedIp = localStorage.getItem('networkIP')
    if (savedIp) {
      setCurrentIp(savedIp)
      setIp(savedIp)
    }
  }, [])

  const handleSave = () => {
    if (!ip.trim()) {
      showToast.error("Por favor ingresa una IP válida")
      return
    }

    // Validar formato de IP
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!ipRegex.test(ip)) {
      showToast.error("Formato de IP inválido")
      return
    }

    setNetworkIP(ip)
    setCurrentIp(ip)
    showToast.success(`IP de red configurada: ${ip}`)
  }

  const handleReset = () => {
    localStorage.removeItem('networkIP')
    setCurrentIp("")
    setIp("")
    showToast.success("Configuración de IP reseteada")
  }

  return (
    <Card className="bg-white/90 border-gray-200 backdrop-blur-sm">
      <CardHeader className="border-b border-gray-200 pb-3">
        <CardTitle className="text-gray-800 flex items-center">
          <Wifi className="mr-2 h-5 w-5 text-[#EA7704]" />
          Configuración de Red para QR
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="network-ip">IP de Red Local</Label>
            <Input
              id="network-ip"
              type="text"
              placeholder="172.16.3.123"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              className="bg-white border-gray-300"
            />
            <p className="text-xs text-gray-600">
              Esta IP se usará para generar códigos QR accesibles desde otros dispositivos en la red.
            </p>
          </div>

          {currentIp && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Check className="h-4 w-4 text-green-600" />
              <span>IP actual: <strong>{currentIp}</strong></span>
            </div>
          )}

          <div className="flex space-x-2">
            <Button 
              onClick={handleSave}
              className="bg-[#EA7704] hover:bg-[#D1660A] text-white"
            >
              <Check className="mr-2 h-4 w-4" />
              Guardar IP
            </Button>
            
            {currentIp && (
              <Button 
                onClick={handleReset}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <X className="mr-2 h-4 w-4" />
                Resetear
              </Button>
            )}
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
            <p><strong>Nota:</strong> Para encontrar tu IP de red:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Windows: <code>ipconfig</code> en CMD</li>
              <li>Mac/Linux: <code>ifconfig</code> en Terminal</li>
              <li>Busca la IP que empiece con 192.168.x.x o 10.x.x.x</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
