'use client'

import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

let ticket = 0

export function openWait() {
  const mine = ++ticket
  void Swal.fire({
    title: 'ESPERA',
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    background: '#0f0f18',
    color: '#e6e9ff',
    didOpen: () => {
      if (mine !== ticket) {
        Swal.close()
        return
      }
      Swal.showLoading()
    },
  })
}

export function closeWait() {
  ticket += 1
  Swal.close()
}
