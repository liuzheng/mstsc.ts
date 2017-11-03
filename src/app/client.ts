import * as io from 'socket.io-client';
import {Mstsc} from './mstsc.service';
/**
 * Mstsc client
 * Input client connection (mouse and keyboard)
 * bitmap processing
 * @param canvas {canvas} rendering element
 */
export class Client {
  canvas: any;
  render: any;
  socket: any;
  activeSession: any;

  constructor(private mstsc: Mstsc) {
  }

  mouseButtonMap(button: number) {
    switch (button) {
      case 0:
        return 1;
      case 2:
        return 2;
      default:
        return 0;
    }
  }

  create(id: string) {
    this.canvas = document.getElementById(id);
    // create renderer
    this.render = this.mstsc.Canvas.create(id);
    this.socket = null;
    this.activeSession = false;
    this.install();
  }

  install() {
    const self = this;
    // bind mouse move event
    this.canvas.addEventListener('mousemove', function (e) {
      if (!self.socket) {
        return;
      }

      const offset = self.mstsc.elementOffset();
      self.socket.emit('mouse', e.clientX - offset.left, e.clientY - offset.top, 0, false);
      e.preventDefault || !self.activeSession();
      return false;
    });
    this.canvas.addEventListener('mousedown', function (e) {
      if (!self.socket) {
        return;
      }

      const offset = self.mstsc.elementOffset();
      self.socket.emit('mouse', e.clientX - offset.left, e.clientY - offset.top, self.mouseButtonMap(e.button), true);
      e.preventDefault();
      return false;
    });
    this.canvas.addEventListener('mouseup', function (e) {
      if (!self.socket || !self.activeSession) {
        return;
      }

      const offset = this.mstsc.elementOffset(self.canvas);
      self.socket.emit('mouse', e.clientX - offset.left, e.clientY - offset.top, self.mouseButtonMap(e.button), false);
      e.preventDefault();
      return false;
    });
    this.canvas.addEventListener('contextmenu', function (e) {
      if (!self.socket || !self.activeSession) {
        return;
      }

      const offset = this.mstsc.elementOffset(self.canvas);
      self.socket.emit('mouse', e.clientX - offset.left, e.clientY - offset.top, self.mouseButtonMap(e.button), false);
      e.preventDefault();
      return false;
    });
    this.canvas.addEventListener('DOMMouseScroll', function (e) {
      if (!self.socket || !self.activeSession) {
        return;
      }

      const isHorizontal = false;
      const delta = e.detail;
      const step = Math.round(Math.abs(delta) * 15 / 8);

      const offset = this.mstsc.elementOffset(self.canvas);
      self.socket.emit('wheel', e.clientX - offset.left, e.clientY - offset.top, step, delta > 0, isHorizontal);
      e.preventDefault();
      return false;
    });
    this.canvas.addEventListener('mousewheel', function (e) {
      if (!self.socket || !self.activeSession) {
        return;
      }

      const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const delta = isHorizontal ? e.deltaX : e.deltaY;
      const step = Math.round(Math.abs(delta) * 15 / 8);

      const offset = this.mstsc.elementOffset(self.canvas);
      self.socket.emit('wheel', e.clientX - offset.left, e.clientY - offset.top, step, delta > 0, isHorizontal);
      e.preventDefault();
      return false;
    });

    // bind keyboard event
    window.addEventListener('keydown', function (e) {
      if (!self.socket || !self.activeSession) {
        return;
      }

      self.socket.emit('scancode', self.mstsc.scancode(e), true);

      e.preventDefault();
      return false;
    });
    window.addEventListener('keyup', function (e) {
      if (!self.socket || !self.activeSession) {
        return;
      }

      self.socket.emit('scancode', self.mstsc.scancode(e), false);

      e.preventDefault();
      return false;
    });

    return this;
  }

  /**
   * connect
   * @param ip {string} ip target for rdp
   * @param domain {string} microsoft domain
   * @param username {string} session username
   * @param password {string} session password
   * @param next {function} asynchrone end callback
   */
  connect(ip, domain, username, password, next) {
    // compute socket.io path (cozy cloud integration)
    const parts = document.location.pathname.split('/')
      , base = parts.slice(0, parts.length - 1).join('/') + '/'
      , path = base + 'rdp/socket.io';


    // start connection
    const self = this;
    this.socket = io(window.location.protocol + '//' + window.location.host, {'path': path}).on('rdp-connect', function () {
      // this event can be occured twice (RDP protocol stack artefact)
      console.log('[mstsc.js] connected');
      self.activeSession = true;
    }).on('rdp-bitmap', function (bitmap) {
      console.log('[mstsc.js] bitmap update bpp : ' + bitmap.bitsPerPixel);
      self.render.update(bitmap);
    }).on('rdp-close', function () {
      next(null);
      console.log('[mstsc.js] close');
      self.activeSession = false;
    }).on('rdp-error', function (err) {
      next(err);
      console.log('[mstsc.js] error : ' + err.code + '(' + err.message + ')');
      self.activeSession = false;
    });

    // emit infos event
    this.socket.emit('infos', {
      ip: ip,
      port: 3389,
      screen: {
        width: this.canvas.width,
        height: this.canvas.height
      },
      domain: domain,
      username: username,
      password: password,
      locale: Mstsc.locale()
    });
  }
}
