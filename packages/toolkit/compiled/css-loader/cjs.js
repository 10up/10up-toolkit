/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 8738:
/***/ (function(module) {

/*
 *  big.js v5.2.2
 *  A small, fast, easy-to-use library for arbitrary-precision decimal arithmetic.
 *  Copyright (c) 2018 Michael Mclaughlin <M8ch88l@gmail.com>
 *  https://github.com/MikeMcl/big.js/LICENCE
 */
;(function (GLOBAL) {
  'use strict';
  var Big,


/************************************** EDITABLE DEFAULTS *****************************************/


    // The default values below must be integers within the stated ranges.

    /*
     * The maximum number of decimal places (DP) of the results of operations involving division:
     * div and sqrt, and pow with negative exponents.
     */
    DP = 20,          // 0 to MAX_DP

    /*
     * The rounding mode (RM) used when rounding to the above decimal places.
     *
     *  0  Towards zero (i.e. truncate, no rounding).       (ROUND_DOWN)
     *  1  To nearest neighbour. If equidistant, round up.  (ROUND_HALF_UP)
     *  2  To nearest neighbour. If equidistant, to even.   (ROUND_HALF_EVEN)
     *  3  Away from zero.                                  (ROUND_UP)
     */
    RM = 1,             // 0, 1, 2 or 3

    // The maximum value of DP and Big.DP.
    MAX_DP = 1E6,       // 0 to 1000000

    // The maximum magnitude of the exponent argument to the pow method.
    MAX_POWER = 1E6,    // 1 to 1000000

    /*
     * The negative exponent (NE) at and beneath which toString returns exponential notation.
     * (JavaScript numbers: -7)
     * -1000000 is the minimum recommended exponent value of a Big.
     */
    NE = -7,            // 0 to -1000000

    /*
     * The positive exponent (PE) at and above which toString returns exponential notation.
     * (JavaScript numbers: 21)
     * 1000000 is the maximum recommended exponent value of a Big.
     * (This limit is not enforced or checked.)
     */
    PE = 21,            // 0 to 1000000


/**************************************************************************************************/


    // Error messages.
    NAME = '[big.js] ',
    INVALID = NAME + 'Invalid ',
    INVALID_DP = INVALID + 'decimal places',
    INVALID_RM = INVALID + 'rounding mode',
    DIV_BY_ZERO = NAME + 'Division by zero',

    // The shared prototype object.
    P = {},
    UNDEFINED = void 0,
    NUMERIC = /^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;


  /*
   * Create and return a Big constructor.
   *
   */
  function _Big_() {

    /*
     * The Big constructor and exported function.
     * Create and return a new instance of a Big number object.
     *
     * n {number|string|Big} A numeric value.
     */
    function Big(n) {
      var x = this;

      // Enable constructor usage without new.
      if (!(x instanceof Big)) return n === UNDEFINED ? _Big_() : new Big(n);

      // Duplicate.
      if (n instanceof Big) {
        x.s = n.s;
        x.e = n.e;
        x.c = n.c.slice();
      } else {
        parse(x, n);
      }

      /*
       * Retain a reference to this Big constructor, and shadow Big.prototype.constructor which
       * points to Object.
       */
      x.constructor = Big;
    }

    Big.prototype = P;
    Big.DP = DP;
    Big.RM = RM;
    Big.NE = NE;
    Big.PE = PE;
    Big.version = '5.2.2';

    return Big;
  }


  /*
   * Parse the number or string value passed to a Big constructor.
   *
   * x {Big} A Big number instance.
   * n {number|string} A numeric value.
   */
  function parse(x, n) {
    var e, i, nl;

    // Minus zero?
    if (n === 0 && 1 / n < 0) n = '-0';
    else if (!NUMERIC.test(n += '')) throw Error(INVALID + 'number');

    // Determine sign.
    x.s = n.charAt(0) == '-' ? (n = n.slice(1), -1) : 1;

    // Decimal point?
    if ((e = n.indexOf('.')) > -1) n = n.replace('.', '');

    // Exponential form?
    if ((i = n.search(/e/i)) > 0) {

      // Determine exponent.
      if (e < 0) e = i;
      e += +n.slice(i + 1);
      n = n.substring(0, i);
    } else if (e < 0) {

      // Integer.
      e = n.length;
    }

    nl = n.length;

    // Determine leading zeros.
    for (i = 0; i < nl && n.charAt(i) == '0';) ++i;

    if (i == nl) {

      // Zero.
      x.c = [x.e = 0];
    } else {

      // Determine trailing zeros.
      for (; nl > 0 && n.charAt(--nl) == '0';);
      x.e = e - i - 1;
      x.c = [];

      // Convert string to array of digits without leading/trailing zeros.
      for (e = 0; i <= nl;) x.c[e++] = +n.charAt(i++);
    }

    return x;
  }


  /*
   * Round Big x to a maximum of dp decimal places using rounding mode rm.
   * Called by stringify, P.div, P.round and P.sqrt.
   *
   * x {Big} The Big to round.
   * dp {number} Integer, 0 to MAX_DP inclusive.
   * rm {number} 0, 1, 2 or 3 (DOWN, HALF_UP, HALF_EVEN, UP)
   * [more] {boolean} Whether the result of division was truncated.
   */
  function round(x, dp, rm, more) {
    var xc = x.c,
      i = x.e + dp + 1;

    if (i < xc.length) {
      if (rm === 1) {

        // xc[i] is the digit after the digit that may be rounded up.
        more = xc[i] >= 5;
      } else if (rm === 2) {
        more = xc[i] > 5 || xc[i] == 5 &&
          (more || i < 0 || xc[i + 1] !== UNDEFINED || xc[i - 1] & 1);
      } else if (rm === 3) {
        more = more || !!xc[0];
      } else {
        more = false;
        if (rm !== 0) throw Error(INVALID_RM);
      }

      if (i < 1) {
        xc.length = 1;

        if (more) {

          // 1, 0.1, 0.01, 0.001, 0.0001 etc.
          x.e = -dp;
          xc[0] = 1;
        } else {

          // Zero.
          xc[0] = x.e = 0;
        }
      } else {

        // Remove any digits after the required decimal places.
        xc.length = i--;

        // Round up?
        if (more) {

          // Rounding up may mean the previous digit has to be rounded up.
          for (; ++xc[i] > 9;) {
            xc[i] = 0;
            if (!i--) {
              ++x.e;
              xc.unshift(1);
            }
          }
        }

        // Remove trailing zeros.
        for (i = xc.length; !xc[--i];) xc.pop();
      }
    } else if (rm < 0 || rm > 3 || rm !== ~~rm) {
      throw Error(INVALID_RM);
    }

    return x;
  }


  /*
   * Return a string representing the value of Big x in normal or exponential notation.
   * Handles P.toExponential, P.toFixed, P.toJSON, P.toPrecision, P.toString and P.valueOf.
   *
   * x {Big}
   * id? {number} Caller id.
   *         1 toExponential
   *         2 toFixed
   *         3 toPrecision
   *         4 valueOf
   * n? {number|undefined} Caller's argument.
   * k? {number|undefined}
   */
  function stringify(x, id, n, k) {
    var e, s,
      Big = x.constructor,
      z = !x.c[0];

    if (n !== UNDEFINED) {
      if (n !== ~~n || n < (id == 3) || n > MAX_DP) {
        throw Error(id == 3 ? INVALID + 'precision' : INVALID_DP);
      }

      x = new Big(x);

      // The index of the digit that may be rounded up.
      n = k - x.e;

      // Round?
      if (x.c.length > ++k) round(x, n, Big.RM);

      // toFixed: recalculate k as x.e may have changed if value rounded up.
      if (id == 2) k = x.e + n + 1;

      // Append zeros?
      for (; x.c.length < k;) x.c.push(0);
    }

    e = x.e;
    s = x.c.join('');
    n = s.length;

    // Exponential notation?
    if (id != 2 && (id == 1 || id == 3 && k <= e || e <= Big.NE || e >= Big.PE)) {
      s = s.charAt(0) + (n > 1 ? '.' + s.slice(1) : '') + (e < 0 ? 'e' : 'e+') + e;

    // Normal notation.
    } else if (e < 0) {
      for (; ++e;) s = '0' + s;
      s = '0.' + s;
    } else if (e > 0) {
      if (++e > n) for (e -= n; e--;) s += '0';
      else if (e < n) s = s.slice(0, e) + '.' + s.slice(e);
    } else if (n > 1) {
      s = s.charAt(0) + '.' + s.slice(1);
    }

    return x.s < 0 && (!z || id == 4) ? '-' + s : s;
  }


  // Prototype/instance methods


  /*
   * Return a new Big whose value is the absolute value of this Big.
   */
  P.abs = function () {
    var x = new this.constructor(this);
    x.s = 1;
    return x;
  };


  /*
   * Return 1 if the value of this Big is greater than the value of Big y,
   *       -1 if the value of this Big is less than the value of Big y, or
   *        0 if they have the same value.
  */
  P.cmp = function (y) {
    var isneg,
      x = this,
      xc = x.c,
      yc = (y = new x.constructor(y)).c,
      i = x.s,
      j = y.s,
      k = x.e,
      l = y.e;

    // Either zero?
    if (!xc[0] || !yc[0]) return !xc[0] ? !yc[0] ? 0 : -j : i;

    // Signs differ?
    if (i != j) return i;

    isneg = i < 0;

    // Compare exponents.
    if (k != l) return k > l ^ isneg ? 1 : -1;

    j = (k = xc.length) < (l = yc.length) ? k : l;

    // Compare digit by digit.
    for (i = -1; ++i < j;) {
      if (xc[i] != yc[i]) return xc[i] > yc[i] ^ isneg ? 1 : -1;
    }

    // Compare lengths.
    return k == l ? 0 : k > l ^ isneg ? 1 : -1;
  };


  /*
   * Return a new Big whose value is the value of this Big divided by the value of Big y, rounded,
   * if necessary, to a maximum of Big.DP decimal places using rounding mode Big.RM.
   */
  P.div = function (y) {
    var x = this,
      Big = x.constructor,
      a = x.c,                  // dividend
      b = (y = new Big(y)).c,   // divisor
      k = x.s == y.s ? 1 : -1,
      dp = Big.DP;

    if (dp !== ~~dp || dp < 0 || dp > MAX_DP) throw Error(INVALID_DP);

    // Divisor is zero?
    if (!b[0]) throw Error(DIV_BY_ZERO);

    // Dividend is 0? Return +-0.
    if (!a[0]) return new Big(k * 0);

    var bl, bt, n, cmp, ri,
      bz = b.slice(),
      ai = bl = b.length,
      al = a.length,
      r = a.slice(0, bl),   // remainder
      rl = r.length,
      q = y,                // quotient
      qc = q.c = [],
      qi = 0,
      d = dp + (q.e = x.e - y.e) + 1;    // number of digits of the result

    q.s = k;
    k = d < 0 ? 0 : d;

    // Create version of divisor with leading zero.
    bz.unshift(0);

    // Add zeros to make remainder as long as divisor.
    for (; rl++ < bl;) r.push(0);

    do {

      // n is how many times the divisor goes into current remainder.
      for (n = 0; n < 10; n++) {

        // Compare divisor and remainder.
        if (bl != (rl = r.length)) {
          cmp = bl > rl ? 1 : -1;
        } else {
          for (ri = -1, cmp = 0; ++ri < bl;) {
            if (b[ri] != r[ri]) {
              cmp = b[ri] > r[ri] ? 1 : -1;
              break;
            }
          }
        }

        // If divisor < remainder, subtract divisor from remainder.
        if (cmp < 0) {

          // Remainder can't be more than 1 digit longer than divisor.
          // Equalise lengths using divisor with extra leading zero?
          for (bt = rl == bl ? b : bz; rl;) {
            if (r[--rl] < bt[rl]) {
              ri = rl;
              for (; ri && !r[--ri];) r[ri] = 9;
              --r[ri];
              r[rl] += 10;
            }
            r[rl] -= bt[rl];
          }

          for (; !r[0];) r.shift();
        } else {
          break;
        }
      }

      // Add the digit n to the result array.
      qc[qi++] = cmp ? n : ++n;

      // Update the remainder.
      if (r[0] && cmp) r[rl] = a[ai] || 0;
      else r = [a[ai]];

    } while ((ai++ < al || r[0] !== UNDEFINED) && k--);

    // Leading zero? Do not remove if result is simply zero (qi == 1).
    if (!qc[0] && qi != 1) {

      // There can't be more than one zero.
      qc.shift();
      q.e--;
    }

    // Round?
    if (qi > d) round(q, dp, Big.RM, r[0] !== UNDEFINED);

    return q;
  };


  /*
   * Return true if the value of this Big is equal to the value of Big y, otherwise return false.
   */
  P.eq = function (y) {
    return !this.cmp(y);
  };


  /*
   * Return true if the value of this Big is greater than the value of Big y, otherwise return
   * false.
   */
  P.gt = function (y) {
    return this.cmp(y) > 0;
  };


  /*
   * Return true if the value of this Big is greater than or equal to the value of Big y, otherwise
   * return false.
   */
  P.gte = function (y) {
    return this.cmp(y) > -1;
  };


  /*
   * Return true if the value of this Big is less than the value of Big y, otherwise return false.
   */
  P.lt = function (y) {
    return this.cmp(y) < 0;
  };


  /*
   * Return true if the value of this Big is less than or equal to the value of Big y, otherwise
   * return false.
   */
  P.lte = function (y) {
    return this.cmp(y) < 1;
  };


  /*
   * Return a new Big whose value is the value of this Big minus the value of Big y.
   */
  P.minus = P.sub = function (y) {
    var i, j, t, xlty,
      x = this,
      Big = x.constructor,
      a = x.s,
      b = (y = new Big(y)).s;

    // Signs differ?
    if (a != b) {
      y.s = -b;
      return x.plus(y);
    }

    var xc = x.c.slice(),
      xe = x.e,
      yc = y.c,
      ye = y.e;

    // Either zero?
    if (!xc[0] || !yc[0]) {

      // y is non-zero? x is non-zero? Or both are zero.
      return yc[0] ? (y.s = -b, y) : new Big(xc[0] ? x : 0);
    }

    // Determine which is the bigger number. Prepend zeros to equalise exponents.
    if (a = xe - ye) {

      if (xlty = a < 0) {
        a = -a;
        t = xc;
      } else {
        ye = xe;
        t = yc;
      }

      t.reverse();
      for (b = a; b--;) t.push(0);
      t.reverse();
    } else {

      // Exponents equal. Check digit by digit.
      j = ((xlty = xc.length < yc.length) ? xc : yc).length;

      for (a = b = 0; b < j; b++) {
        if (xc[b] != yc[b]) {
          xlty = xc[b] < yc[b];
          break;
        }
      }
    }

    // x < y? Point xc to the array of the bigger number.
    if (xlty) {
      t = xc;
      xc = yc;
      yc = t;
      y.s = -y.s;
    }

    /*
     * Append zeros to xc if shorter. No need to add zeros to yc if shorter as subtraction only
     * needs to start at yc.length.
     */
    if ((b = (j = yc.length) - (i = xc.length)) > 0) for (; b--;) xc[i++] = 0;

    // Subtract yc from xc.
    for (b = i; j > a;) {
      if (xc[--j] < yc[j]) {
        for (i = j; i && !xc[--i];) xc[i] = 9;
        --xc[i];
        xc[j] += 10;
      }

      xc[j] -= yc[j];
    }

    // Remove trailing zeros.
    for (; xc[--b] === 0;) xc.pop();

    // Remove leading zeros and adjust exponent accordingly.
    for (; xc[0] === 0;) {
      xc.shift();
      --ye;
    }

    if (!xc[0]) {

      // n - n = +0
      y.s = 1;

      // Result must be zero.
      xc = [ye = 0];
    }

    y.c = xc;
    y.e = ye;

    return y;
  };


  /*
   * Return a new Big whose value is the value of this Big modulo the value of Big y.
   */
  P.mod = function (y) {
    var ygtx,
      x = this,
      Big = x.constructor,
      a = x.s,
      b = (y = new Big(y)).s;

    if (!y.c[0]) throw Error(DIV_BY_ZERO);

    x.s = y.s = 1;
    ygtx = y.cmp(x) == 1;
    x.s = a;
    y.s = b;

    if (ygtx) return new Big(x);

    a = Big.DP;
    b = Big.RM;
    Big.DP = Big.RM = 0;
    x = x.div(y);
    Big.DP = a;
    Big.RM = b;

    return this.minus(x.times(y));
  };


  /*
   * Return a new Big whose value is the value of this Big plus the value of Big y.
   */
  P.plus = P.add = function (y) {
    var t,
      x = this,
      Big = x.constructor,
      a = x.s,
      b = (y = new Big(y)).s;

    // Signs differ?
    if (a != b) {
      y.s = -b;
      return x.minus(y);
    }

    var xe = x.e,
      xc = x.c,
      ye = y.e,
      yc = y.c;

    // Either zero? y is non-zero? x is non-zero? Or both are zero.
    if (!xc[0] || !yc[0]) return yc[0] ? y : new Big(xc[0] ? x : a * 0);

    xc = xc.slice();

    // Prepend zeros to equalise exponents.
    // Note: reverse faster than unshifts.
    if (a = xe - ye) {
      if (a > 0) {
        ye = xe;
        t = yc;
      } else {
        a = -a;
        t = xc;
      }

      t.reverse();
      for (; a--;) t.push(0);
      t.reverse();
    }

    // Point xc to the longer array.
    if (xc.length - yc.length < 0) {
      t = yc;
      yc = xc;
      xc = t;
    }

    a = yc.length;

    // Only start adding at yc.length - 1 as the further digits of xc can be left as they are.
    for (b = 0; a; xc[a] %= 10) b = (xc[--a] = xc[a] + yc[a] + b) / 10 | 0;

    // No need to check for zero, as +x + +y != 0 && -x + -y != 0

    if (b) {
      xc.unshift(b);
      ++ye;
    }

    // Remove trailing zeros.
    for (a = xc.length; xc[--a] === 0;) xc.pop();

    y.c = xc;
    y.e = ye;

    return y;
  };


  /*
   * Return a Big whose value is the value of this Big raised to the power n.
   * If n is negative, round to a maximum of Big.DP decimal places using rounding
   * mode Big.RM.
   *
   * n {number} Integer, -MAX_POWER to MAX_POWER inclusive.
   */
  P.pow = function (n) {
    var x = this,
      one = new x.constructor(1),
      y = one,
      isneg = n < 0;

    if (n !== ~~n || n < -MAX_POWER || n > MAX_POWER) throw Error(INVALID + 'exponent');
    if (isneg) n = -n;

    for (;;) {
      if (n & 1) y = y.times(x);
      n >>= 1;
      if (!n) break;
      x = x.times(x);
    }

    return isneg ? one.div(y) : y;
  };


  /*
   * Return a new Big whose value is the value of this Big rounded using rounding mode rm
   * to a maximum of dp decimal places, or, if dp is negative, to an integer which is a
   * multiple of 10**-dp.
   * If dp is not specified, round to 0 decimal places.
   * If rm is not specified, use Big.RM.
   *
   * dp? {number} Integer, -MAX_DP to MAX_DP inclusive.
   * rm? 0, 1, 2 or 3 (ROUND_DOWN, ROUND_HALF_UP, ROUND_HALF_EVEN, ROUND_UP)
   */
  P.round = function (dp, rm) {
    var Big = this.constructor;
    if (dp === UNDEFINED) dp = 0;
    else if (dp !== ~~dp || dp < -MAX_DP || dp > MAX_DP) throw Error(INVALID_DP);
    return round(new Big(this), dp, rm === UNDEFINED ? Big.RM : rm);
  };


  /*
   * Return a new Big whose value is the square root of the value of this Big, rounded, if
   * necessary, to a maximum of Big.DP decimal places using rounding mode Big.RM.
   */
  P.sqrt = function () {
    var r, c, t,
      x = this,
      Big = x.constructor,
      s = x.s,
      e = x.e,
      half = new Big(0.5);

    // Zero?
    if (!x.c[0]) return new Big(x);

    // Negative?
    if (s < 0) throw Error(NAME + 'No square root');

    // Estimate.
    s = Math.sqrt(x + '');

    // Math.sqrt underflow/overflow?
    // Re-estimate: pass x coefficient to Math.sqrt as integer, then adjust the result exponent.
    if (s === 0 || s === 1 / 0) {
      c = x.c.join('');
      if (!(c.length + e & 1)) c += '0';
      s = Math.sqrt(c);
      e = ((e + 1) / 2 | 0) - (e < 0 || e & 1);
      r = new Big((s == 1 / 0 ? '1e' : (s = s.toExponential()).slice(0, s.indexOf('e') + 1)) + e);
    } else {
      r = new Big(s);
    }

    e = r.e + (Big.DP += 4);

    // Newton-Raphson iteration.
    do {
      t = r;
      r = half.times(t.plus(x.div(t)));
    } while (t.c.slice(0, e).join('') !== r.c.slice(0, e).join(''));

    return round(r, Big.DP -= 4, Big.RM);
  };


  /*
   * Return a new Big whose value is the value of this Big times the value of Big y.
   */
  P.times = P.mul = function (y) {
    var c,
      x = this,
      Big = x.constructor,
      xc = x.c,
      yc = (y = new Big(y)).c,
      a = xc.length,
      b = yc.length,
      i = x.e,
      j = y.e;

    // Determine sign of result.
    y.s = x.s == y.s ? 1 : -1;

    // Return signed 0 if either 0.
    if (!xc[0] || !yc[0]) return new Big(y.s * 0);

    // Initialise exponent of result as x.e + y.e.
    y.e = i + j;

    // If array xc has fewer digits than yc, swap xc and yc, and lengths.
    if (a < b) {
      c = xc;
      xc = yc;
      yc = c;
      j = a;
      a = b;
      b = j;
    }

    // Initialise coefficient array of result with zeros.
    for (c = new Array(j = a + b); j--;) c[j] = 0;

    // Multiply.

    // i is initially xc.length.
    for (i = b; i--;) {
      b = 0;

      // a is yc.length.
      for (j = a + i; j > i;) {

        // Current sum of products at this digit position, plus carry.
        b = c[j] + yc[i] * xc[j - i - 1] + b;
        c[j--] = b % 10;

        // carry
        b = b / 10 | 0;
      }

      c[j] = (c[j] + b) % 10;
    }

    // Increment result exponent if there is a final carry, otherwise remove leading zero.
    if (b) ++y.e;
    else c.shift();

    // Remove trailing zeros.
    for (i = c.length; !c[--i];) c.pop();
    y.c = c;

    return y;
  };


  /*
   * Return a string representing the value of this Big in exponential notation to dp fixed decimal
   * places and rounded using Big.RM.
   *
   * dp? {number} Integer, 0 to MAX_DP inclusive.
   */
  P.toExponential = function (dp) {
    return stringify(this, 1, dp, dp);
  };


  /*
   * Return a string representing the value of this Big in normal notation to dp fixed decimal
   * places and rounded using Big.RM.
   *
   * dp? {number} Integer, 0 to MAX_DP inclusive.
   *
   * (-0).toFixed(0) is '0', but (-0.1).toFixed(0) is '-0'.
   * (-0).toFixed(1) is '0.0', but (-0.01).toFixed(1) is '-0.0'.
   */
  P.toFixed = function (dp) {
    return stringify(this, 2, dp, this.e + dp);
  };


  /*
   * Return a string representing the value of this Big rounded to sd significant digits using
   * Big.RM. Use exponential notation if sd is less than the number of digits necessary to represent
   * the integer part of the value in normal notation.
   *
   * sd {number} Integer, 1 to MAX_DP inclusive.
   */
  P.toPrecision = function (sd) {
    return stringify(this, 3, sd, sd - 1);
  };


  /*
   * Return a string representing the value of this Big.
   * Return exponential notation if this Big has a positive exponent equal to or greater than
   * Big.PE, or a negative exponent equal to or less than Big.NE.
   * Omit the sign for negative zero.
   */
  P.toString = function () {
    return stringify(this);
  };


  /*
   * Return a string representing the value of this Big.
   * Return exponential notation if this Big has a positive exponent equal to or greater than
   * Big.PE, or a negative exponent equal to or less than Big.NE.
   * Include the sign for negative zero.
   */
  P.valueOf = P.toJSON = function () {
    return stringify(this, 4);
  };


  // Export


  Big = _Big_();

  Big['default'] = Big.Big = Big;

  //AMD.
  if (typeof define === 'function' && define.amd) {
    define(function () { return Big; });

  // Node and other CommonJS-like environments that support module.exports.
  } else if ( true && module.exports) {
    module.exports = Big;

  //Browser.
  } else {
    GLOBAL.Big = Big;
  }
})(this);


/***/ }),

/***/ 6124:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = void 0;

class CssSyntaxError extends Error {
  constructor(error) {
    super(error);
    const {
      reason,
      line,
      column,
      file
    } = error;
    this.name = "CssSyntaxError"; // Based on https://github.com/postcss/postcss/blob/master/lib/css-syntax-error.es6#L132
    // We don't need `plugin` and `file` properties.

    this.message = `${this.name}\n\n`;

    if (typeof line !== "undefined") {
      this.message += `(${line}:${column}) `;
    }

    this.message += file ? `${file} ` : "<css input> ";
    this.message += `${reason}`;
    const code = error.showSourceCode();

    if (code) {
      this.message += `\n\n${code}\n`;
    } // We don't need stack https://github.com/postcss/postcss/blob/master/docs/guidelines/runner.md#31-dont-show-js-stack-for-csssyntaxerror


    this.stack = false;
  }

}

exports.default = CssSyntaxError;

/***/ }),

/***/ 8363:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = void 0;

class Warning extends Error {
  constructor(warning) {
    super(warning);
    const {
      text,
      line,
      column
    } = warning;
    this.name = "Warning"; // Based on https://github.com/postcss/postcss/blob/master/lib/warning.es6#L74
    // We don't need `plugin` properties.

    this.message = `${this.name}\n\n`;

    if (typeof line !== "undefined") {
      this.message += `(${line}:${column}) `;
    }

    this.message += `${text}`; // We don't need stack https://github.com/postcss/postcss/blob/master/docs/guidelines/runner.md#31-dont-show-js-stack-for-csssyntaxerror

    this.stack = false;
  }

}

exports.default = Warning;

/***/ }),

/***/ 7583:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


const loader = __nccwpck_require__(5462);

module.exports = loader.default;

/***/ }),

/***/ 5462:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = loader;

var _loaderUtils = __nccwpck_require__(3432);

var _postcss = _interopRequireDefault(__nccwpck_require__(2043));

var _package = _interopRequireDefault(__nccwpck_require__(4698));

var _schemaUtils = __nccwpck_require__(3339);

var _semver = __nccwpck_require__(7753);

var _CssSyntaxError = _interopRequireDefault(__nccwpck_require__(6124));

var _Warning = _interopRequireDefault(__nccwpck_require__(8363));

var _options = _interopRequireDefault(__nccwpck_require__(8735));

var _plugins = __nccwpck_require__(6780);

var _utils = __nccwpck_require__(2474);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
async function loader(content, map, meta) {
  const rawOptions = (0, _loaderUtils.getOptions)(this);
  (0, _schemaUtils.validate)(_options.default, rawOptions, {
    name: "CSS Loader",
    baseDataPath: "options"
  });
  const plugins = [];
  const callback = this.async();
  let options;

  try {
    options = (0, _utils.normalizeOptions)(rawOptions, this);
  } catch (error) {
    callback(error);
    return;
  }

  const replacements = [];
  const exports = [];

  if ((0, _utils.shouldUseModulesPlugins)(options)) {
    plugins.push(...(0, _utils.getModulesPlugins)(options, this));
  }

  const importPluginImports = [];
  const importPluginApi = [];

  if ((0, _utils.shouldUseImportPlugin)(options)) {
    const resolver = this.getResolve({
      conditionNames: ["style"],
      extensions: [".css"],
      mainFields: ["css", "style", "main", "..."],
      mainFiles: ["index", "..."]
    });
    plugins.push((0, _plugins.importParser)({
      imports: importPluginImports,
      api: importPluginApi,
      context: this.context,
      rootContext: this.rootContext,
      filter: (0, _utils.getFilter)(options.import, this.resourcePath),
      resolver,
      urlHandler: url => (0, _loaderUtils.stringifyRequest)(this, (0, _utils.combineRequests)((0, _utils.getPreRequester)(this)(options.importLoaders), url))
    }));
  }

  const urlPluginImports = [];

  if ((0, _utils.shouldUseURLPlugin)(options)) {
    const urlResolver = this.getResolve({
      conditionNames: ["asset"],
      mainFields: ["asset"],
      mainFiles: [],
      extensions: []
    });
    plugins.push((0, _plugins.urlParser)({
      imports: urlPluginImports,
      replacements,
      context: this.context,
      rootContext: this.rootContext,
      filter: (0, _utils.getFilter)(options.url, this.resourcePath),
      resolver: urlResolver,
      urlHandler: url => (0, _loaderUtils.stringifyRequest)(this, url)
    }));
  }

  const icssPluginImports = [];
  const icssPluginApi = [];
  const needToUseIcssPlugin = (0, _utils.shouldUseIcssPlugin)(options);

  if (needToUseIcssPlugin) {
    const icssResolver = this.getResolve({
      conditionNames: ["style"],
      extensions: [],
      mainFields: ["css", "style", "main", "..."],
      mainFiles: ["index", "..."]
    });
    plugins.push((0, _plugins.icssParser)({
      imports: icssPluginImports,
      api: icssPluginApi,
      replacements,
      exports,
      context: this.context,
      rootContext: this.rootContext,
      resolver: icssResolver,
      urlHandler: url => (0, _loaderUtils.stringifyRequest)(this, (0, _utils.combineRequests)((0, _utils.getPreRequester)(this)(options.importLoaders), url))
    }));
  } // Reuse CSS AST (PostCSS AST e.g 'postcss-loader') to avoid reparsing


  if (meta) {
    const {
      ast
    } = meta;

    if (ast && ast.type === "postcss" && (0, _semver.satisfies)(ast.version, `^${_package.default.version}`)) {
      // eslint-disable-next-line no-param-reassign
      content = ast.root;
    }
  }

  const {
    resourcePath
  } = this;
  let result;

  try {
    result = await (0, _postcss.default)(plugins).process(content, {
      hideNothingWarning: true,
      from: resourcePath,
      to: resourcePath,
      map: options.sourceMap ? {
        prev: map ? (0, _utils.normalizeSourceMap)(map, resourcePath) : null,
        inline: false,
        annotation: false
      } : false
    });
  } catch (error) {
    if (error.file) {
      this.addDependency(error.file);
    }

    callback(error.name === "CssSyntaxError" ? new _CssSyntaxError.default(error) : error);
    return;
  }

  for (const warning of result.warnings()) {
    this.emitWarning(new _Warning.default(warning));
  }

  const imports = [].concat(icssPluginImports.sort(_utils.sort)).concat(importPluginImports.sort(_utils.sort)).concat(urlPluginImports.sort(_utils.sort));
  const api = [].concat(importPluginApi.sort(_utils.sort)).concat(icssPluginApi.sort(_utils.sort));

  if (options.modules.exportOnlyLocals !== true) {
    imports.unshift({
      importName: "___CSS_LOADER_API_IMPORT___",
      url: (0, _loaderUtils.stringifyRequest)(this, __nccwpck_require__.ab + "api.js")
    });

    if (options.sourceMap) {
      imports.unshift({
        importName: "___CSS_LOADER_API_SOURCEMAP_IMPORT___",
        url: (0, _loaderUtils.stringifyRequest)(this, __nccwpck_require__.ab + "cssWithMappingToString.js")
      });
    }
  }

  const importCode = (0, _utils.getImportCode)(imports, options);
  const moduleCode = (0, _utils.getModuleCode)(result, api, replacements, options, this);
  const exportCode = (0, _utils.getExportCode)(exports, replacements, needToUseIcssPlugin, options);
  callback(null, `${importCode}${moduleCode}${exportCode}`);
}

/***/ }),

/***/ 6780:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
Object.defineProperty(exports, "importParser", ({
  enumerable: true,
  get: function () {
    return _postcssImportParser.default;
  }
}));
Object.defineProperty(exports, "icssParser", ({
  enumerable: true,
  get: function () {
    return _postcssIcssParser.default;
  }
}));
Object.defineProperty(exports, "urlParser", ({
  enumerable: true,
  get: function () {
    return _postcssUrlParser.default;
  }
}));

var _postcssImportParser = _interopRequireDefault(__nccwpck_require__(9063));

var _postcssIcssParser = _interopRequireDefault(__nccwpck_require__(9454));

var _postcssUrlParser = _interopRequireDefault(__nccwpck_require__(7097));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/***/ }),

/***/ 9454:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = void 0;

var _icssUtils = __nccwpck_require__(4665);

var _utils = __nccwpck_require__(2474);

const plugin = (options = {}) => {
  return {
    postcssPlugin: "postcss-icss-parser",

    async OnceExit(root) {
      const importReplacements = Object.create(null);
      const {
        icssImports,
        icssExports
      } = (0, _icssUtils.extractICSS)(root);
      const imports = new Map();
      const tasks = []; // eslint-disable-next-line guard-for-in

      for (const url in icssImports) {
        const tokens = icssImports[url];

        if (Object.keys(tokens).length === 0) {
          // eslint-disable-next-line no-continue
          continue;
        }

        let normalizedUrl = url;
        let prefix = "";
        const queryParts = normalizedUrl.split("!");

        if (queryParts.length > 1) {
          normalizedUrl = queryParts.pop();
          prefix = queryParts.join("!");
        }

        const request = (0, _utils.requestify)((0, _utils.normalizeUrl)(normalizedUrl, true), options.rootContext);

        const doResolve = async () => {
          const {
            resolver,
            context
          } = options;
          const resolvedUrl = await (0, _utils.resolveRequests)(resolver, context, [...new Set([normalizedUrl, request])]);

          if (!resolvedUrl) {
            return;
          } // eslint-disable-next-line consistent-return


          return {
            url: resolvedUrl,
            prefix,
            tokens
          };
        };

        tasks.push(doResolve());
      }

      const results = await Promise.all(tasks);

      for (let index = 0; index <= results.length - 1; index++) {
        const item = results[index];

        if (!item) {
          // eslint-disable-next-line no-continue
          continue;
        }

        const newUrl = item.prefix ? `${item.prefix}!${item.url}` : item.url;
        const importKey = newUrl;
        let importName = imports.get(importKey);

        if (!importName) {
          importName = `___CSS_LOADER_ICSS_IMPORT_${imports.size}___`;
          imports.set(importKey, importName);
          options.imports.push({
            importName,
            url: options.urlHandler(newUrl),
            icss: true,
            index
          });
          options.api.push({
            importName,
            dedupe: true,
            index
          });
        }

        for (const [replacementIndex, token] of Object.keys(item.tokens).entries()) {
          const replacementName = `___CSS_LOADER_ICSS_IMPORT_${index}_REPLACEMENT_${replacementIndex}___`;
          const localName = item.tokens[token];
          importReplacements[token] = replacementName;
          options.replacements.push({
            replacementName,
            importName,
            localName
          });
        }
      }

      if (Object.keys(importReplacements).length > 0) {
        (0, _icssUtils.replaceSymbols)(root, importReplacements);
      }

      for (const name of Object.keys(icssExports)) {
        const value = (0, _icssUtils.replaceValueSymbols)(icssExports[name], importReplacements);
        options.exports.push({
          name,
          value
        });
      }
    }

  };
};

plugin.postcss = true;
var _default = plugin;
exports.default = _default;

/***/ }),

/***/ 9063:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = void 0;

var _postcssValueParser = _interopRequireDefault(__nccwpck_require__(9285));

var _utils = __nccwpck_require__(2474);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function parseNode(atRule, key) {
  // Convert only top-level @import
  if (atRule.parent.type !== "root") {
    return;
  }

  if (atRule.raws && atRule.raws.afterName && atRule.raws.afterName.trim().length > 0) {
    const lastCommentIndex = atRule.raws.afterName.lastIndexOf("/*");
    const matched = atRule.raws.afterName.slice(lastCommentIndex).match(_utils.WEBPACK_IGNORE_COMMENT_REGEXP);

    if (matched && matched[2] === "true") {
      return;
    }
  }

  const prevNode = atRule.prev();

  if (prevNode && prevNode.type === "comment") {
    const matched = prevNode.text.match(_utils.WEBPACK_IGNORE_COMMENT_REGEXP);

    if (matched && matched[2] === "true") {
      return;
    }
  } // Nodes do not exists - `@import url('http://') :root {}`


  if (atRule.nodes) {
    const error = new Error("It looks like you didn't end your @import statement correctly. Child nodes are attached to it.");
    error.node = atRule;
    throw error;
  }

  const {
    nodes: paramsNodes
  } = (0, _postcssValueParser.default)(atRule[key]); // No nodes - `@import ;`
  // Invalid type - `@import foo-bar;`

  if (paramsNodes.length === 0 || paramsNodes[0].type !== "string" && paramsNodes[0].type !== "function") {
    const error = new Error(`Unable to find uri in "${atRule.toString()}"`);
    error.node = atRule;
    throw error;
  }

  let isStringValue;
  let url;

  if (paramsNodes[0].type === "string") {
    isStringValue = true;
    url = paramsNodes[0].value;
  } else {
    // Invalid function - `@import nourl(test.css);`
    if (paramsNodes[0].value.toLowerCase() !== "url") {
      const error = new Error(`Unable to find uri in "${atRule.toString()}"`);
      error.node = atRule;
      throw error;
    }

    isStringValue = paramsNodes[0].nodes.length !== 0 && paramsNodes[0].nodes[0].type === "string";
    url = isStringValue ? paramsNodes[0].nodes[0].value : _postcssValueParser.default.stringify(paramsNodes[0].nodes);
  }

  url = (0, _utils.normalizeUrl)(url, isStringValue);
  const isRequestable = (0, _utils.isUrlRequestable)(url);
  let prefix;

  if (isRequestable) {
    const queryParts = url.split("!");

    if (queryParts.length > 1) {
      url = queryParts.pop();
      prefix = queryParts.join("!");
    }
  } // Empty url - `@import "";` or `@import url();`


  if (url.trim().length === 0) {
    const error = new Error(`Unable to find uri in "${atRule.toString()}"`);
    error.node = atRule;
    throw error;
  }

  const mediaNodes = paramsNodes.slice(1);
  let media;

  if (mediaNodes.length > 0) {
    media = _postcssValueParser.default.stringify(mediaNodes).trim().toLowerCase();
  } // eslint-disable-next-line consistent-return


  return {
    atRule,
    prefix,
    url,
    media,
    isRequestable
  };
}

const plugin = (options = {}) => {
  return {
    postcssPlugin: "postcss-import-parser",

    prepare(result) {
      const parsedAtRules = [];
      return {
        AtRule: {
          import(atRule) {
            let parsedAtRule;

            try {
              parsedAtRule = parseNode(atRule, "params", result);
            } catch (error) {
              result.warn(error.message, {
                node: error.node
              });
            }

            if (!parsedAtRule) {
              return;
            }

            parsedAtRules.push(parsedAtRule);
          }

        },

        async OnceExit() {
          if (parsedAtRules.length === 0) {
            return;
          }

          const resolvedAtRules = await Promise.all(parsedAtRules.map(async parsedAtRule => {
            const {
              atRule,
              isRequestable,
              prefix,
              url,
              media
            } = parsedAtRule;

            if (options.filter) {
              const needKeep = await options.filter(url, media);

              if (!needKeep) {
                return;
              }
            }

            if (isRequestable) {
              const request = (0, _utils.requestify)(url, options.rootContext);
              const {
                resolver,
                context
              } = options;
              const resolvedUrl = await (0, _utils.resolveRequests)(resolver, context, [...new Set([request, url])]);

              if (!resolvedUrl) {
                return;
              }

              atRule.remove(); // eslint-disable-next-line consistent-return

              return {
                url: resolvedUrl,
                media,
                prefix,
                isRequestable
              };
            }

            atRule.remove(); // eslint-disable-next-line consistent-return

            return {
              url,
              media,
              prefix,
              isRequestable
            };
          }));
          const urlToNameMap = new Map();

          for (let index = 0; index <= resolvedAtRules.length - 1; index++) {
            const resolvedAtRule = resolvedAtRules[index];

            if (!resolvedAtRule) {
              // eslint-disable-next-line no-continue
              continue;
            }

            const {
              url,
              isRequestable,
              media
            } = resolvedAtRule;

            if (!isRequestable) {
              options.api.push({
                url,
                media,
                index
              }); // eslint-disable-next-line no-continue

              continue;
            }

            const {
              prefix
            } = resolvedAtRule;
            const newUrl = prefix ? `${prefix}!${url}` : url;
            let importName = urlToNameMap.get(newUrl);

            if (!importName) {
              importName = `___CSS_LOADER_AT_RULE_IMPORT_${urlToNameMap.size}___`;
              urlToNameMap.set(newUrl, importName);
              options.imports.push({
                importName,
                url: options.urlHandler(newUrl),
                index
              });
            }

            options.api.push({
              importName,
              media,
              index
            });
          }
        }

      };
    }

  };
};

plugin.postcss = true;
var _default = plugin;
exports.default = _default;

/***/ }),

/***/ 7097:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = void 0;

var _postcssValueParser = _interopRequireDefault(__nccwpck_require__(9285));

var _utils = __nccwpck_require__(2474);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const isUrlFunc = /url/i;
const isImageSetFunc = /^(?:-webkit-)?image-set$/i;
const needParseDeclaration = /(?:url|(?:-webkit-)?image-set)\(/i;

function getNodeFromUrlFunc(node) {
  return node.nodes && node.nodes[0];
}

function getWebpackIgnoreCommentValue(index, nodes, inBetween) {
  if (index === 0 && typeof inBetween !== "undefined") {
    return inBetween;
  }

  let prevValueNode = nodes[index - 1];

  if (!prevValueNode) {
    // eslint-disable-next-line consistent-return
    return;
  }

  if (prevValueNode.type === "space") {
    if (!nodes[index - 2]) {
      // eslint-disable-next-line consistent-return
      return;
    }

    prevValueNode = nodes[index - 2];
  }

  if (prevValueNode.type !== "comment") {
    // eslint-disable-next-line consistent-return
    return;
  }

  const matched = prevValueNode.value.match(_utils.WEBPACK_IGNORE_COMMENT_REGEXP);
  return matched && matched[2] === "true";
}

function shouldHandleURL(url, declaration, result) {
  if (url.length === 0) {
    result.warn(`Unable to find uri in '${declaration.toString()}'`, {
      node: declaration
    });
    return false;
  }

  if (!(0, _utils.isUrlRequestable)(url)) {
    return false;
  }

  return true;
}

function parseDeclaration(declaration, key, result) {
  if (!needParseDeclaration.test(declaration[key])) {
    return;
  }

  const parsed = (0, _postcssValueParser.default)(declaration.raws && declaration.raws.value && declaration.raws.value.raw ? declaration.raws.value.raw : declaration[key]);
  let inBetween;

  if (declaration.raws && declaration.raws.between) {
    const lastCommentIndex = declaration.raws.between.lastIndexOf("/*");
    const matched = declaration.raws.between.slice(lastCommentIndex).match(_utils.WEBPACK_IGNORE_COMMENT_REGEXP);

    if (matched) {
      inBetween = matched[2] === "true";
    }
  }

  let isIgnoreOnDeclaration = false;
  const prevNode = declaration.prev();

  if (prevNode && prevNode.type === "comment") {
    const matched = prevNode.text.match(_utils.WEBPACK_IGNORE_COMMENT_REGEXP);

    if (matched) {
      isIgnoreOnDeclaration = matched[2] === "true";
    }
  }

  let needIgnore;
  const parsedURLs = [];
  parsed.walk((valueNode, index, valueNodes) => {
    if (valueNode.type !== "function") {
      return;
    }

    if (isUrlFunc.test(valueNode.value)) {
      needIgnore = getWebpackIgnoreCommentValue(index, valueNodes, inBetween);

      if (isIgnoreOnDeclaration && typeof needIgnore === "undefined" || needIgnore) {
        if (needIgnore) {
          // eslint-disable-next-line no-undefined
          needIgnore = undefined;
        }

        return;
      }

      const {
        nodes
      } = valueNode;
      const isStringValue = nodes.length !== 0 && nodes[0].type === "string";
      let url = isStringValue ? nodes[0].value : _postcssValueParser.default.stringify(nodes);
      url = (0, _utils.normalizeUrl)(url, isStringValue); // Do not traverse inside `url`

      if (!shouldHandleURL(url, declaration, result)) {
        // eslint-disable-next-line consistent-return
        return false;
      }

      const queryParts = url.split("!");
      let prefix;

      if (queryParts.length > 1) {
        url = queryParts.pop();
        prefix = queryParts.join("!");
      }

      parsedURLs.push({
        declaration,
        parsed,
        node: getNodeFromUrlFunc(valueNode),
        prefix,
        url,
        needQuotes: false
      }); // eslint-disable-next-line consistent-return

      return false;
    } else if (isImageSetFunc.test(valueNode.value)) {
      for (const [innerIndex, nNode] of valueNode.nodes.entries()) {
        const {
          type,
          value
        } = nNode;

        if (type === "function" && isUrlFunc.test(value)) {
          needIgnore = getWebpackIgnoreCommentValue(innerIndex, valueNode.nodes);

          if (isIgnoreOnDeclaration && typeof needIgnore === "undefined" || needIgnore) {
            if (needIgnore) {
              // eslint-disable-next-line no-undefined
              needIgnore = undefined;
            } // eslint-disable-next-line no-continue


            continue;
          }

          const {
            nodes
          } = nNode;
          const isStringValue = nodes.length !== 0 && nodes[0].type === "string";
          let url = isStringValue ? nodes[0].value : _postcssValueParser.default.stringify(nodes);
          url = (0, _utils.normalizeUrl)(url, isStringValue); // Do not traverse inside `url`

          if (!shouldHandleURL(url, declaration, result)) {
            // eslint-disable-next-line consistent-return
            return false;
          }

          const queryParts = url.split("!");
          let prefix;

          if (queryParts.length > 1) {
            url = queryParts.pop();
            prefix = queryParts.join("!");
          }

          parsedURLs.push({
            declaration,
            parsed,
            node: getNodeFromUrlFunc(nNode),
            prefix,
            url,
            needQuotes: false
          });
        } else if (type === "string") {
          needIgnore = getWebpackIgnoreCommentValue(innerIndex, valueNode.nodes);

          if (isIgnoreOnDeclaration && typeof needIgnore === "undefined" || needIgnore) {
            if (needIgnore) {
              // eslint-disable-next-line no-undefined
              needIgnore = undefined;
            } // eslint-disable-next-line no-continue


            continue;
          }

          let url = (0, _utils.normalizeUrl)(value, true); // Do not traverse inside `url`

          if (!shouldHandleURL(url, declaration, result)) {
            // eslint-disable-next-line consistent-return
            return false;
          }

          const queryParts = url.split("!");
          let prefix;

          if (queryParts.length > 1) {
            url = queryParts.pop();
            prefix = queryParts.join("!");
          }

          parsedURLs.push({
            declaration,
            parsed,
            node: nNode,
            prefix,
            url,
            needQuotes: true
          });
        }
      } // Do not traverse inside `image-set`
      // eslint-disable-next-line consistent-return


      return false;
    }
  }); // eslint-disable-next-line consistent-return

  return parsedURLs;
}

const plugin = (options = {}) => {
  return {
    postcssPlugin: "postcss-url-parser",

    prepare(result) {
      const parsedDeclarations = [];
      return {
        Declaration(declaration) {
          const parsedURL = parseDeclaration(declaration, "value", result);

          if (!parsedURL) {
            return;
          }

          parsedDeclarations.push(...parsedURL);
        },

        async OnceExit() {
          if (parsedDeclarations.length === 0) {
            return;
          }

          const resolvedDeclarations = await Promise.all(parsedDeclarations.map(async parsedDeclaration => {
            const {
              url
            } = parsedDeclaration;

            if (options.filter) {
              const needKeep = await options.filter(url);

              if (!needKeep) {
                return;
              }
            }

            const splittedUrl = url.split(/(\?)?#/);
            const [pathname, query, hashOrQuery] = splittedUrl;
            let hash = query ? "?" : "";
            hash += hashOrQuery ? `#${hashOrQuery}` : "";
            const request = (0, _utils.requestify)(pathname, options.rootContext);
            const {
              resolver,
              context
            } = options;
            const resolvedUrl = await (0, _utils.resolveRequests)(resolver, context, [...new Set([request, url])]);

            if (!resolvedUrl) {
              return;
            } // eslint-disable-next-line consistent-return


            return { ...parsedDeclaration,
              url: resolvedUrl,
              hash
            };
          }));
          const urlToNameMap = new Map();
          const urlToReplacementMap = new Map();
          let hasUrlImportHelper = false;

          for (let index = 0; index <= resolvedDeclarations.length - 1; index++) {
            const item = resolvedDeclarations[index];

            if (!item) {
              // eslint-disable-next-line no-continue
              continue;
            }

            if (!hasUrlImportHelper) {
              options.imports.push({
                importName: "___CSS_LOADER_GET_URL_IMPORT___",
                url: options.urlHandler(__nccwpck_require__.ab + "getUrl.js"),
                index: -1
              });
              hasUrlImportHelper = true;
            }

            const {
              url,
              prefix
            } = item;
            const newUrl = prefix ? `${prefix}!${url}` : url;
            let importName = urlToNameMap.get(newUrl);

            if (!importName) {
              importName = `___CSS_LOADER_URL_IMPORT_${urlToNameMap.size}___`;
              urlToNameMap.set(newUrl, importName);
              options.imports.push({
                importName,
                url: options.urlHandler(newUrl),
                index
              });
            }

            const {
              hash,
              needQuotes
            } = item;
            const replacementKey = JSON.stringify({
              newUrl,
              hash,
              needQuotes
            });
            let replacementName = urlToReplacementMap.get(replacementKey);

            if (!replacementName) {
              replacementName = `___CSS_LOADER_URL_REPLACEMENT_${urlToReplacementMap.size}___`;
              urlToReplacementMap.set(replacementKey, replacementName);
              options.replacements.push({
                replacementName,
                importName,
                hash,
                needQuotes
              });
            } // eslint-disable-next-line no-param-reassign


            item.node.type = "word"; // eslint-disable-next-line no-param-reassign

            item.node.value = replacementName; // eslint-disable-next-line no-param-reassign

            item.declaration.value = item.parsed.toString();
          }
        }

      };
    }

  };
};

plugin.postcss = true;
var _default = plugin;
exports.default = _default;

/***/ }),

/***/ 2474:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.normalizeOptions = normalizeOptions;
exports.shouldUseModulesPlugins = shouldUseModulesPlugins;
exports.shouldUseImportPlugin = shouldUseImportPlugin;
exports.shouldUseURLPlugin = shouldUseURLPlugin;
exports.shouldUseIcssPlugin = shouldUseIcssPlugin;
exports.normalizeUrl = normalizeUrl;
exports.requestify = requestify;
exports.getFilter = getFilter;
exports.getModulesOptions = getModulesOptions;
exports.getModulesPlugins = getModulesPlugins;
exports.normalizeSourceMap = normalizeSourceMap;
exports.getPreRequester = getPreRequester;
exports.getImportCode = getImportCode;
exports.getModuleCode = getModuleCode;
exports.getExportCode = getExportCode;
exports.resolveRequests = resolveRequests;
exports.isUrlRequestable = isUrlRequestable;
exports.sort = sort;
exports.combineRequests = combineRequests;
exports.camelCase = camelCase;
exports.WEBPACK_IGNORE_COMMENT_REGEXP = void 0;

var _url = __nccwpck_require__(8835);

var _path = _interopRequireDefault(__nccwpck_require__(5622));

var _loaderUtils = __nccwpck_require__(3432);

var _postcssModulesValues = _interopRequireDefault(__nccwpck_require__(4270));

var _postcssModulesLocalByDefault = _interopRequireDefault(__nccwpck_require__(9932));

var _postcssModulesExtractImports = _interopRequireDefault(__nccwpck_require__(4192));

var _postcssModulesScope = _interopRequireDefault(__nccwpck_require__(7475));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
const WEBPACK_IGNORE_COMMENT_REGEXP = /webpackIgnore:(\s+)?(true|false)/; // eslint-disable-next-line no-useless-escape

exports.WEBPACK_IGNORE_COMMENT_REGEXP = WEBPACK_IGNORE_COMMENT_REGEXP;
const regexSingleEscape = /[ -,.\/:-@[\]\^`{-~]/;
const regexExcessiveSpaces = /(^|\\+)?(\\[A-F0-9]{1,6})\x20(?![a-fA-F0-9\x20])/g;

const preserveCamelCase = string => {
  let result = string;
  let isLastCharLower = false;
  let isLastCharUpper = false;
  let isLastLastCharUpper = false;

  for (let i = 0; i < result.length; i++) {
    const character = result[i];

    if (isLastCharLower && /[\p{Lu}]/u.test(character)) {
      result = `${result.slice(0, i)}-${result.slice(i)}`;
      isLastCharLower = false;
      isLastLastCharUpper = isLastCharUpper;
      isLastCharUpper = true;
      i += 1;
    } else if (isLastCharUpper && isLastLastCharUpper && /[\p{Ll}]/u.test(character)) {
      result = `${result.slice(0, i - 1)}-${result.slice(i - 1)}`;
      isLastLastCharUpper = isLastCharUpper;
      isLastCharUpper = false;
      isLastCharLower = true;
    } else {
      isLastCharLower = character.toLowerCase() === character && character.toUpperCase() !== character;
      isLastLastCharUpper = isLastCharUpper;
      isLastCharUpper = character.toUpperCase() === character && character.toLowerCase() !== character;
    }
  }

  return result;
};

function camelCase(input) {
  let result = input.trim();

  if (result.length === 0) {
    return "";
  }

  if (result.length === 1) {
    return result.toLowerCase();
  }

  const hasUpperCase = result !== result.toLowerCase();

  if (hasUpperCase) {
    result = preserveCamelCase(result);
  }

  return result.replace(/^[_.\- ]+/, "").toLowerCase().replace(/[_.\- ]+([\p{Alpha}\p{N}_]|$)/gu, (_, p1) => p1.toUpperCase()).replace(/\d+([\p{Alpha}\p{N}_]|$)/gu, m => m.toUpperCase());
}

function escape(string) {
  let output = "";
  let counter = 0;

  while (counter < string.length) {
    // eslint-disable-next-line no-plusplus
    const character = string.charAt(counter++);
    let value; // eslint-disable-next-line no-control-regex

    if (/[\t\n\f\r\x0B]/.test(character)) {
      const codePoint = character.charCodeAt();
      value = `\\${codePoint.toString(16).toUpperCase()} `;
    } else if (character === "\\" || regexSingleEscape.test(character)) {
      value = `\\${character}`;
    } else {
      value = character;
    }

    output += value;
  }

  const firstChar = string.charAt(0);

  if (/^-[-\d]/.test(output)) {
    output = `\\-${output.slice(1)}`;
  } else if (/\d/.test(firstChar)) {
    output = `\\3${firstChar} ${output.slice(1)}`;
  } // Remove spaces after `\HEX` escapes that are not followed by a hex digit,
  // since they’re redundant. Note that this is only possible if the escape
  // sequence isn’t preceded by an odd number of backslashes.


  output = output.replace(regexExcessiveSpaces, ($0, $1, $2) => {
    if ($1 && $1.length % 2) {
      // It’s not safe to remove the space, so don’t.
      return $0;
    } // Strip the space.


    return ($1 || "") + $2;
  });
  return output;
}

function gobbleHex(str) {
  const lower = str.toLowerCase();
  let hex = "";
  let spaceTerminated = false; // eslint-disable-next-line no-undefined

  for (let i = 0; i < 6 && lower[i] !== undefined; i++) {
    const code = lower.charCodeAt(i); // check to see if we are dealing with a valid hex char [a-f|0-9]

    const valid = code >= 97 && code <= 102 || code >= 48 && code <= 57; // https://drafts.csswg.org/css-syntax/#consume-escaped-code-point

    spaceTerminated = code === 32;

    if (!valid) {
      break;
    }

    hex += lower[i];
  }

  if (hex.length === 0) {
    // eslint-disable-next-line no-undefined
    return undefined;
  }

  const codePoint = parseInt(hex, 16);
  const isSurrogate = codePoint >= 0xd800 && codePoint <= 0xdfff; // Add special case for
  // "If this number is zero, or is for a surrogate, or is greater than the maximum allowed code point"
  // https://drafts.csswg.org/css-syntax/#maximum-allowed-code-point

  if (isSurrogate || codePoint === 0x0000 || codePoint > 0x10ffff) {
    return ["\uFFFD", hex.length + (spaceTerminated ? 1 : 0)];
  }

  return [String.fromCodePoint(codePoint), hex.length + (spaceTerminated ? 1 : 0)];
}

const CONTAINS_ESCAPE = /\\/;

function unescape(str) {
  const needToProcess = CONTAINS_ESCAPE.test(str);

  if (!needToProcess) {
    return str;
  }

  let ret = "";

  for (let i = 0; i < str.length; i++) {
    if (str[i] === "\\") {
      const gobbled = gobbleHex(str.slice(i + 1, i + 7)); // eslint-disable-next-line no-undefined

      if (gobbled !== undefined) {
        ret += gobbled[0];
        i += gobbled[1]; // eslint-disable-next-line no-continue

        continue;
      } // Retain a pair of \\ if double escaped `\\\\`
      // https://github.com/postcss/postcss-selector-parser/commit/268c9a7656fb53f543dc620aa5b73a30ec3ff20e


      if (str[i + 1] === "\\") {
        ret += "\\";
        i += 1; // eslint-disable-next-line no-continue

        continue;
      } // if \\ is at the end of the string retain it
      // https://github.com/postcss/postcss-selector-parser/commit/01a6b346e3612ce1ab20219acc26abdc259ccefb


      if (str.length === i + 1) {
        ret += str[i];
      } // eslint-disable-next-line no-continue


      continue;
    }

    ret += str[i];
  }

  return ret;
}

function normalizePath(file) {
  return _path.default.sep === "\\" ? file.replace(/\\/g, "/") : file;
} // eslint-disable-next-line no-control-regex


const filenameReservedRegex = /[<>:"/\\|?*]/g; // eslint-disable-next-line no-control-regex

const reControlChars = /[\u0000-\u001f\u0080-\u009f]/g;

function escapeLocalIdent(localident) {
  // TODO simplify in the next major release
  return escape(localident // For `[hash]` placeholder
  .replace(/^((-?[0-9])|--)/, "_$1").replace(filenameReservedRegex, "-").replace(reControlChars, "-").replace(/\./g, "-"));
}

function defaultGetLocalIdent(loaderContext, localIdentName, localName, options) {
  let relativeMatchResource = ""; // eslint-disable-next-line no-underscore-dangle

  if (loaderContext._module && loaderContext._module.matchResource) {
    relativeMatchResource = `${normalizePath( // eslint-disable-next-line no-underscore-dangle
    _path.default.relative(options.context, loaderContext._module.matchResource))}\x00`;
  }

  const relativeResourcePath = normalizePath(_path.default.relative(options.context, loaderContext.resourcePath)); // eslint-disable-next-line no-param-reassign

  options.content = `${options.hashPrefix}${relativeMatchResource}${relativeResourcePath}\x00${localName}`;
  return (0, _loaderUtils.interpolateName)(loaderContext, localIdentName, options);
}

const NATIVE_WIN32_PATH = /^[A-Z]:[/\\]|^\\\\/i;

function normalizeUrl(url, isStringValue) {
  let normalizedUrl = url.replace(/^( |\t\n|\r\n|\r|\f)*/g, "").replace(/( |\t\n|\r\n|\r|\f)*$/g, "");

  if (isStringValue && /\\(\n|\r\n|\r|\f)/.test(normalizedUrl)) {
    normalizedUrl = normalizedUrl.replace(/\\(\n|\r\n|\r|\f)/g, "");
  }

  if (NATIVE_WIN32_PATH.test(url)) {
    try {
      normalizedUrl = decodeURI(normalizedUrl);
    } catch (error) {// Ignore
    }

    return normalizedUrl;
  }

  normalizedUrl = unescape(normalizedUrl);

  try {
    normalizedUrl = decodeURI(normalizedUrl);
  } catch (error) {// Ignore
  }

  return normalizedUrl;
}

function requestify(url, rootContext) {
  if (/^file:/i.test(url)) {
    return (0, _url.fileURLToPath)(url);
  }

  return url.charAt(0) === "/" ? (0, _loaderUtils.urlToRequest)(url, rootContext) : (0, _loaderUtils.urlToRequest)(url);
}

function getFilter(filter, resourcePath) {
  return (...args) => {
    if (typeof filter === "function") {
      return filter(...args, resourcePath);
    }

    return true;
  };
}

function getValidLocalName(localName, exportLocalsConvention) {
  if (exportLocalsConvention === "dashesOnly") {
    return dashesCamelCase(localName);
  }

  return camelCase(localName);
}

const moduleRegExp = /\.module(s)?\.\w+$/i;
const icssRegExp = /\.icss\.\w+$/i;

function getModulesOptions(rawOptions, loaderContext) {
  const resourcePath = // eslint-disable-next-line no-underscore-dangle
  loaderContext._module && loaderContext._module.matchResource || loaderContext.resourcePath;
  let isIcss;

  if (typeof rawOptions.modules === "undefined") {
    const isModules = moduleRegExp.test(resourcePath);

    if (!isModules) {
      isIcss = icssRegExp.test(resourcePath);
    }

    if (!isModules && !isIcss) {
      return false;
    }
  } else if (typeof rawOptions.modules === "boolean" && rawOptions.modules === false) {
    return false;
  }

  let modulesOptions = {
    compileType: isIcss ? "icss" : "module",
    auto: true,
    mode: "local",
    exportGlobals: false,
    localIdentName: "[hash:base64]",
    localIdentContext: loaderContext.rootContext,
    localIdentHashPrefix: "",
    // eslint-disable-next-line no-undefined
    localIdentRegExp: undefined,
    // eslint-disable-next-line no-undefined
    getLocalIdent: undefined,
    namedExport: false,
    exportLocalsConvention: "asIs",
    exportOnlyLocals: false
  };

  if (typeof rawOptions.modules === "boolean" || typeof rawOptions.modules === "string") {
    modulesOptions.mode = typeof rawOptions.modules === "string" ? rawOptions.modules : "local";
  } else {
    if (rawOptions.modules) {
      if (typeof rawOptions.modules.auto === "boolean") {
        const isModules = rawOptions.modules.auto && moduleRegExp.test(resourcePath);

        if (!isModules) {
          return false;
        }
      } else if (rawOptions.modules.auto instanceof RegExp) {
        const isModules = rawOptions.modules.auto.test(resourcePath);

        if (!isModules) {
          return false;
        }
      } else if (typeof rawOptions.modules.auto === "function") {
        const isModule = rawOptions.modules.auto(resourcePath);

        if (!isModule) {
          return false;
        }
      }

      if (rawOptions.modules.namedExport === true && typeof rawOptions.modules.exportLocalsConvention === "undefined") {
        modulesOptions.exportLocalsConvention = "camelCaseOnly";
      }
    }

    modulesOptions = { ...modulesOptions,
      ...(rawOptions.modules || {})
    };
  }

  if (typeof modulesOptions.mode === "function") {
    modulesOptions.mode = modulesOptions.mode(loaderContext.resourcePath);
  }

  if (modulesOptions.namedExport === true) {
    if (rawOptions.esModule === false) {
      throw new Error('The "modules.namedExport" option requires the "esModules" option to be enabled');
    }

    if (modulesOptions.exportLocalsConvention !== "camelCaseOnly" && modulesOptions.exportLocalsConvention !== "dashesOnly") {
      throw new Error('The "modules.namedExport" option requires the "modules.exportLocalsConvention" option to be "camelCaseOnly" or "dashesOnly"');
    }
  }

  if (/\[emoji(?::(\d+))?\]/i.test(modulesOptions.localIdentName)) {
    loaderContext.emitWarning("Emoji is deprecated and will be removed in next major release.");
  }

  return modulesOptions;
}

function normalizeOptions(rawOptions, loaderContext) {
  const modulesOptions = getModulesOptions(rawOptions, loaderContext);
  return {
    url: typeof rawOptions.url === "undefined" ? true : rawOptions.url,
    import: typeof rawOptions.import === "undefined" ? true : rawOptions.import,
    modules: modulesOptions,
    sourceMap: typeof rawOptions.sourceMap === "boolean" ? rawOptions.sourceMap : loaderContext.sourceMap,
    importLoaders: typeof rawOptions.importLoaders === "string" ? parseInt(rawOptions.importLoaders, 10) : rawOptions.importLoaders,
    esModule: typeof rawOptions.esModule === "undefined" ? true : rawOptions.esModule
  };
}

function shouldUseImportPlugin(options) {
  if (options.modules.exportOnlyLocals) {
    return false;
  }

  if (typeof options.import === "boolean") {
    return options.import;
  }

  return true;
}

function shouldUseURLPlugin(options) {
  if (options.modules.exportOnlyLocals) {
    return false;
  }

  if (typeof options.url === "boolean") {
    return options.url;
  }

  return true;
}

function shouldUseModulesPlugins(options) {
  return options.modules.compileType === "module";
}

function shouldUseIcssPlugin(options) {
  return options.icss === true || Boolean(options.modules);
}

function getModulesPlugins(options, loaderContext) {
  const {
    mode,
    getLocalIdent,
    localIdentName,
    localIdentContext,
    localIdentHashPrefix,
    localIdentRegExp
  } = options.modules;
  let plugins = [];

  try {
    plugins = [_postcssModulesValues.default, (0, _postcssModulesLocalByDefault.default)({
      mode
    }), (0, _postcssModulesExtractImports.default)(), (0, _postcssModulesScope.default)({
      generateScopedName(exportName) {
        let localIdent;

        if (typeof getLocalIdent !== "undefined") {
          localIdent = getLocalIdent(loaderContext, localIdentName, unescape(exportName), {
            context: localIdentContext,
            hashPrefix: localIdentHashPrefix,
            regExp: localIdentRegExp
          });
        } // A null/undefined value signals that we should invoke the default
        // getLocalIdent method.


        if (typeof localIdent === "undefined" || localIdent === null) {
          localIdent = defaultGetLocalIdent(loaderContext, localIdentName, unescape(exportName), {
            context: localIdentContext,
            hashPrefix: localIdentHashPrefix,
            regExp: localIdentRegExp
          });
          return escapeLocalIdent(localIdent).replace(/\\\[local\\]/gi, exportName);
        }

        return escapeLocalIdent(localIdent);
      },

      exportGlobals: options.modules.exportGlobals
    })];
  } catch (error) {
    loaderContext.emitError(error);
  }

  return plugins;
}

const IS_NATIVE_WIN32_PATH = /^[a-z]:[/\\]|^\\\\/i;
const ABSOLUTE_SCHEME = /^[a-z0-9+\-.]+:/i;

function getURLType(source) {
  if (source[0] === "/") {
    if (source[1] === "/") {
      return "scheme-relative";
    }

    return "path-absolute";
  }

  if (IS_NATIVE_WIN32_PATH.test(source)) {
    return "path-absolute";
  }

  return ABSOLUTE_SCHEME.test(source) ? "absolute" : "path-relative";
}

function normalizeSourceMap(map, resourcePath) {
  let newMap = map; // Some loader emit source map as string
  // Strip any JSON XSSI avoidance prefix from the string (as documented in the source maps specification), and then parse the string as JSON.

  if (typeof newMap === "string") {
    newMap = JSON.parse(newMap);
  }

  delete newMap.file;
  const {
    sourceRoot
  } = newMap;
  delete newMap.sourceRoot;

  if (newMap.sources) {
    // Source maps should use forward slash because it is URLs (https://github.com/mozilla/source-map/issues/91)
    // We should normalize path because previous loaders like `sass-loader` using backslash when generate source map
    newMap.sources = newMap.sources.map(source => {
      // Non-standard syntax from `postcss`
      if (source.indexOf("<") === 0) {
        return source;
      }

      const sourceType = getURLType(source); // Do no touch `scheme-relative` and `absolute` URLs

      if (sourceType === "path-relative" || sourceType === "path-absolute") {
        const absoluteSource = sourceType === "path-relative" && sourceRoot ? _path.default.resolve(sourceRoot, normalizePath(source)) : normalizePath(source);
        return _path.default.relative(_path.default.dirname(resourcePath), absoluteSource);
      }

      return source;
    });
  }

  return newMap;
}

function getPreRequester({
  loaders,
  loaderIndex
}) {
  const cache = Object.create(null);
  return number => {
    if (cache[number]) {
      return cache[number];
    }

    if (number === false) {
      cache[number] = "";
    } else {
      const loadersRequest = loaders.slice(loaderIndex, loaderIndex + 1 + (typeof number !== "number" ? 0 : number)).map(x => x.request).join("!");
      cache[number] = `-!${loadersRequest}!`;
    }

    return cache[number];
  };
}

function getImportCode(imports, options) {
  let code = "";

  for (const item of imports) {
    const {
      importName,
      url,
      icss
    } = item;

    if (options.esModule) {
      if (icss && options.modules.namedExport) {
        code += `import ${options.modules.exportOnlyLocals ? "" : `${importName}, `}* as ${importName}_NAMED___ from ${url};\n`;
      } else {
        code += `import ${importName} from ${url};\n`;
      }
    } else {
      code += `var ${importName} = require(${url});\n`;
    }
  }

  return code ? `// Imports\n${code}` : "";
}

function normalizeSourceMapForRuntime(map, loaderContext) {
  const resultMap = map ? map.toJSON() : null;

  if (resultMap) {
    delete resultMap.file;
    resultMap.sourceRoot = "";
    resultMap.sources = resultMap.sources.map(source => {
      // Non-standard syntax from `postcss`
      if (source.indexOf("<") === 0) {
        return source;
      }

      const sourceType = getURLType(source);

      if (sourceType !== "path-relative") {
        return source;
      }

      const resourceDirname = _path.default.dirname(loaderContext.resourcePath);

      const absoluteSource = _path.default.resolve(resourceDirname, source);

      const contextifyPath = normalizePath(_path.default.relative(loaderContext.rootContext, absoluteSource));
      return `webpack://./${contextifyPath}`;
    });
  }

  return JSON.stringify(resultMap);
}

function getModuleCode(result, api, replacements, options, loaderContext) {
  if (options.modules.exportOnlyLocals === true) {
    return "";
  }

  const sourceMapValue = options.sourceMap ? `,${normalizeSourceMapForRuntime(result.map, loaderContext)}` : "";
  let code = JSON.stringify(result.css);
  let beforeCode = `var ___CSS_LOADER_EXPORT___ = ___CSS_LOADER_API_IMPORT___(${options.sourceMap ? "___CSS_LOADER_API_SOURCEMAP_IMPORT___" : "function(i){return i[1]}"});\n`;

  for (const item of api) {
    const {
      url,
      media,
      dedupe
    } = item;
    beforeCode += url ? `___CSS_LOADER_EXPORT___.push([module.id, ${JSON.stringify(`@import url(${url});`)}${media ? `, ${JSON.stringify(media)}` : ""}]);\n` : `___CSS_LOADER_EXPORT___.i(${item.importName}${media ? `, ${JSON.stringify(media)}` : dedupe ? ', ""' : ""}${dedupe ? ", true" : ""});\n`;
  }

  for (const item of replacements) {
    const {
      replacementName,
      importName,
      localName
    } = item;

    if (localName) {
      code = code.replace(new RegExp(replacementName, "g"), () => options.modules.namedExport ? `" + ${importName}_NAMED___[${JSON.stringify(getValidLocalName(localName, options.modules.exportLocalsConvention))}] + "` : `" + ${importName}.locals[${JSON.stringify(localName)}] + "`);
    } else {
      const {
        hash,
        needQuotes
      } = item;
      const getUrlOptions = [].concat(hash ? [`hash: ${JSON.stringify(hash)}`] : []).concat(needQuotes ? "needQuotes: true" : []);
      const preparedOptions = getUrlOptions.length > 0 ? `, { ${getUrlOptions.join(", ")} }` : "";
      beforeCode += `var ${replacementName} = ___CSS_LOADER_GET_URL_IMPORT___(${importName}${preparedOptions});\n`;
      code = code.replace(new RegExp(replacementName, "g"), () => `" + ${replacementName} + "`);
    }
  }

  return `${beforeCode}// Module\n___CSS_LOADER_EXPORT___.push([module.id, ${code}, ""${sourceMapValue}]);\n`;
}

function dashesCamelCase(str) {
  return str.replace(/-+(\w)/g, (match, firstLetter) => firstLetter.toUpperCase());
}

function getExportCode(exports, replacements, needToUseIcssPlugin, options) {
  let code = "// Exports\n";

  if (!needToUseIcssPlugin) {
    code += `${options.esModule ? "export default" : "module.exports ="} ___CSS_LOADER_EXPORT___;\n`;
    return code;
  }

  let localsCode = "";

  const addExportToLocalsCode = (name, value) => {
    if (options.modules.namedExport) {
      localsCode += `export var ${name} = ${JSON.stringify(value)};\n`;
    } else {
      if (localsCode) {
        localsCode += `,\n`;
      }

      localsCode += `\t${JSON.stringify(name)}: ${JSON.stringify(value)}`;
    }
  };

  for (const {
    name,
    value
  } of exports) {
    switch (options.modules.exportLocalsConvention) {
      case "camelCase":
        {
          addExportToLocalsCode(name, value);
          const modifiedName = camelCase(name);

          if (modifiedName !== name) {
            addExportToLocalsCode(modifiedName, value);
          }

          break;
        }

      case "camelCaseOnly":
        {
          addExportToLocalsCode(camelCase(name), value);
          break;
        }

      case "dashes":
        {
          addExportToLocalsCode(name, value);
          const modifiedName = dashesCamelCase(name);

          if (modifiedName !== name) {
            addExportToLocalsCode(modifiedName, value);
          }

          break;
        }

      case "dashesOnly":
        {
          addExportToLocalsCode(dashesCamelCase(name), value);
          break;
        }

      case "asIs":
      default:
        addExportToLocalsCode(name, value);
        break;
    }
  }

  for (const item of replacements) {
    const {
      replacementName,
      localName
    } = item;

    if (localName) {
      const {
        importName
      } = item;
      localsCode = localsCode.replace(new RegExp(replacementName, "g"), () => {
        if (options.modules.namedExport) {
          return `" + ${importName}_NAMED___[${JSON.stringify(getValidLocalName(localName, options.modules.exportLocalsConvention))}] + "`;
        } else if (options.modules.exportOnlyLocals) {
          return `" + ${importName}[${JSON.stringify(localName)}] + "`;
        }

        return `" + ${importName}.locals[${JSON.stringify(localName)}] + "`;
      });
    } else {
      localsCode = localsCode.replace(new RegExp(replacementName, "g"), () => `" + ${replacementName} + "`);
    }
  }

  if (options.modules.exportOnlyLocals) {
    code += options.modules.namedExport ? localsCode : `${options.esModule ? "export default" : "module.exports ="} {\n${localsCode}\n};\n`;
    return code;
  }

  code += options.modules.namedExport ? localsCode : `___CSS_LOADER_EXPORT___.locals = {${localsCode ? `\n${localsCode}\n` : ""}};\n`;
  code += `${options.esModule ? "export default" : "module.exports ="} ___CSS_LOADER_EXPORT___;\n`;
  return code;
}

async function resolveRequests(resolve, context, possibleRequests) {
  return resolve(context, possibleRequests[0]).then(result => result).catch(error => {
    const [, ...tailPossibleRequests] = possibleRequests;

    if (tailPossibleRequests.length === 0) {
      throw error;
    }

    return resolveRequests(resolve, context, tailPossibleRequests);
  });
}

function isUrlRequestable(url) {
  // Protocol-relative URLs
  if (/^\/\//.test(url)) {
    return false;
  } // `file:` protocol


  if (/^file:/i.test(url)) {
    return true;
  } // Absolute URLs


  if (/^[a-z][a-z0-9+.-]*:/i.test(url) && !NATIVE_WIN32_PATH.test(url)) {
    return false;
  } // `#` URLs


  if (/^#/.test(url)) {
    return false;
  }

  return true;
}

function sort(a, b) {
  return a.index - b.index;
}

function combineRequests(preRequest, url) {
  const idx = url.indexOf("!=!");
  return idx !== -1 ? url.slice(0, idx + 3) + preRequest + url.slice(idx + 3) : preRequest + url;
}

/***/ }),

/***/ 9972:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const ANY = Symbol('SemVer ANY')
// hoisted class for cyclic dependency
class Comparator {
  static get ANY () {
    return ANY
  }
  constructor (comp, options) {
    options = parseOptions(options)

    if (comp instanceof Comparator) {
      if (comp.loose === !!options.loose) {
        return comp
      } else {
        comp = comp.value
      }
    }

    debug('comparator', comp, options)
    this.options = options
    this.loose = !!options.loose
    this.parse(comp)

    if (this.semver === ANY) {
      this.value = ''
    } else {
      this.value = this.operator + this.semver.version
    }

    debug('comp', this)
  }

  parse (comp) {
    const r = this.options.loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR]
    const m = comp.match(r)

    if (!m) {
      throw new TypeError(`Invalid comparator: ${comp}`)
    }

    this.operator = m[1] !== undefined ? m[1] : ''
    if (this.operator === '=') {
      this.operator = ''
    }

    // if it literally is just '>' or '' then allow anything.
    if (!m[2]) {
      this.semver = ANY
    } else {
      this.semver = new SemVer(m[2], this.options.loose)
    }
  }

  toString () {
    return this.value
  }

  test (version) {
    debug('Comparator.test', version, this.options.loose)

    if (this.semver === ANY || version === ANY) {
      return true
    }

    if (typeof version === 'string') {
      try {
        version = new SemVer(version, this.options)
      } catch (er) {
        return false
      }
    }

    return cmp(version, this.operator, this.semver, this.options)
  }

  intersects (comp, options) {
    if (!(comp instanceof Comparator)) {
      throw new TypeError('a Comparator is required')
    }

    if (!options || typeof options !== 'object') {
      options = {
        loose: !!options,
        includePrerelease: false
      }
    }

    if (this.operator === '') {
      if (this.value === '') {
        return true
      }
      return new Range(comp.value, options).test(this.value)
    } else if (comp.operator === '') {
      if (comp.value === '') {
        return true
      }
      return new Range(this.value, options).test(comp.semver)
    }

    const sameDirectionIncreasing =
      (this.operator === '>=' || this.operator === '>') &&
      (comp.operator === '>=' || comp.operator === '>')
    const sameDirectionDecreasing =
      (this.operator === '<=' || this.operator === '<') &&
      (comp.operator === '<=' || comp.operator === '<')
    const sameSemVer = this.semver.version === comp.semver.version
    const differentDirectionsInclusive =
      (this.operator === '>=' || this.operator === '<=') &&
      (comp.operator === '>=' || comp.operator === '<=')
    const oppositeDirectionsLessThan =
      cmp(this.semver, '<', comp.semver, options) &&
      (this.operator === '>=' || this.operator === '>') &&
        (comp.operator === '<=' || comp.operator === '<')
    const oppositeDirectionsGreaterThan =
      cmp(this.semver, '>', comp.semver, options) &&
      (this.operator === '<=' || this.operator === '<') &&
        (comp.operator === '>=' || comp.operator === '>')

    return (
      sameDirectionIncreasing ||
      sameDirectionDecreasing ||
      (sameSemVer && differentDirectionsInclusive) ||
      oppositeDirectionsLessThan ||
      oppositeDirectionsGreaterThan
    )
  }
}

module.exports = Comparator

const parseOptions = __nccwpck_require__(1713)
const {re, t} = __nccwpck_require__(5412)
const cmp = __nccwpck_require__(7929)
const debug = __nccwpck_require__(1382)
const SemVer = __nccwpck_require__(9785)
const Range = __nccwpck_require__(5058)


/***/ }),

/***/ 5058:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

// hoisted class for cyclic dependency
class Range {
  constructor (range, options) {
    options = parseOptions(options)

    if (range instanceof Range) {
      if (
        range.loose === !!options.loose &&
        range.includePrerelease === !!options.includePrerelease
      ) {
        return range
      } else {
        return new Range(range.raw, options)
      }
    }

    if (range instanceof Comparator) {
      // just put it in the set and return
      this.raw = range.value
      this.set = [[range]]
      this.format()
      return this
    }

    this.options = options
    this.loose = !!options.loose
    this.includePrerelease = !!options.includePrerelease

    // First, split based on boolean or ||
    this.raw = range
    this.set = range
      .split(/\s*\|\|\s*/)
      // map the range to a 2d array of comparators
      .map(range => this.parseRange(range.trim()))
      // throw out any comparator lists that are empty
      // this generally means that it was not a valid range, which is allowed
      // in loose mode, but will still throw if the WHOLE range is invalid.
      .filter(c => c.length)

    if (!this.set.length) {
      throw new TypeError(`Invalid SemVer Range: ${range}`)
    }

    // if we have any that are not the null set, throw out null sets.
    if (this.set.length > 1) {
      // keep the first one, in case they're all null sets
      const first = this.set[0]
      this.set = this.set.filter(c => !isNullSet(c[0]))
      if (this.set.length === 0)
        this.set = [first]
      else if (this.set.length > 1) {
        // if we have any that are *, then the range is just *
        for (const c of this.set) {
          if (c.length === 1 && isAny(c[0])) {
            this.set = [c]
            break
          }
        }
      }
    }

    this.format()
  }

  format () {
    this.range = this.set
      .map((comps) => {
        return comps.join(' ').trim()
      })
      .join('||')
      .trim()
    return this.range
  }

  toString () {
    return this.range
  }

  parseRange (range) {
    range = range.trim()

    // memoize range parsing for performance.
    // this is a very hot path, and fully deterministic.
    const memoOpts = Object.keys(this.options).join(',')
    const memoKey = `parseRange:${memoOpts}:${range}`
    const cached = cache.get(memoKey)
    if (cached)
      return cached

    const loose = this.options.loose
    // `1.2.3 - 1.2.4` => `>=1.2.3 <=1.2.4`
    const hr = loose ? re[t.HYPHENRANGELOOSE] : re[t.HYPHENRANGE]
    range = range.replace(hr, hyphenReplace(this.options.includePrerelease))
    debug('hyphen replace', range)
    // `> 1.2.3 < 1.2.5` => `>1.2.3 <1.2.5`
    range = range.replace(re[t.COMPARATORTRIM], comparatorTrimReplace)
    debug('comparator trim', range, re[t.COMPARATORTRIM])

    // `~ 1.2.3` => `~1.2.3`
    range = range.replace(re[t.TILDETRIM], tildeTrimReplace)

    // `^ 1.2.3` => `^1.2.3`
    range = range.replace(re[t.CARETTRIM], caretTrimReplace)

    // normalize spaces
    range = range.split(/\s+/).join(' ')

    // At this point, the range is completely trimmed and
    // ready to be split into comparators.

    const compRe = loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR]
    const rangeList = range
      .split(' ')
      .map(comp => parseComparator(comp, this.options))
      .join(' ')
      .split(/\s+/)
      // >=0.0.0 is equivalent to *
      .map(comp => replaceGTE0(comp, this.options))
      // in loose mode, throw out any that are not valid comparators
      .filter(this.options.loose ? comp => !!comp.match(compRe) : () => true)
      .map(comp => new Comparator(comp, this.options))

    // if any comparators are the null set, then replace with JUST null set
    // if more than one comparator, remove any * comparators
    // also, don't include the same comparator more than once
    const l = rangeList.length
    const rangeMap = new Map()
    for (const comp of rangeList) {
      if (isNullSet(comp))
        return [comp]
      rangeMap.set(comp.value, comp)
    }
    if (rangeMap.size > 1 && rangeMap.has(''))
      rangeMap.delete('')

    const result = [...rangeMap.values()]
    cache.set(memoKey, result)
    return result
  }

  intersects (range, options) {
    if (!(range instanceof Range)) {
      throw new TypeError('a Range is required')
    }

    return this.set.some((thisComparators) => {
      return (
        isSatisfiable(thisComparators, options) &&
        range.set.some((rangeComparators) => {
          return (
            isSatisfiable(rangeComparators, options) &&
            thisComparators.every((thisComparator) => {
              return rangeComparators.every((rangeComparator) => {
                return thisComparator.intersects(rangeComparator, options)
              })
            })
          )
        })
      )
    })
  }

  // if ANY of the sets match ALL of its comparators, then pass
  test (version) {
    if (!version) {
      return false
    }

    if (typeof version === 'string') {
      try {
        version = new SemVer(version, this.options)
      } catch (er) {
        return false
      }
    }

    for (let i = 0; i < this.set.length; i++) {
      if (testSet(this.set[i], version, this.options)) {
        return true
      }
    }
    return false
  }
}
module.exports = Range

const LRU = __nccwpck_require__(7129)
const cache = new LRU({ max: 1000 })

const parseOptions = __nccwpck_require__(1713)
const Comparator = __nccwpck_require__(9972)
const debug = __nccwpck_require__(1382)
const SemVer = __nccwpck_require__(9785)
const {
  re,
  t,
  comparatorTrimReplace,
  tildeTrimReplace,
  caretTrimReplace
} = __nccwpck_require__(5412)

const isNullSet = c => c.value === '<0.0.0-0'
const isAny = c => c.value === ''

// take a set of comparators and determine whether there
// exists a version which can satisfy it
const isSatisfiable = (comparators, options) => {
  let result = true
  const remainingComparators = comparators.slice()
  let testComparator = remainingComparators.pop()

  while (result && remainingComparators.length) {
    result = remainingComparators.every((otherComparator) => {
      return testComparator.intersects(otherComparator, options)
    })

    testComparator = remainingComparators.pop()
  }

  return result
}

// comprised of xranges, tildes, stars, and gtlt's at this point.
// already replaced the hyphen ranges
// turn into a set of JUST comparators.
const parseComparator = (comp, options) => {
  debug('comp', comp, options)
  comp = replaceCarets(comp, options)
  debug('caret', comp)
  comp = replaceTildes(comp, options)
  debug('tildes', comp)
  comp = replaceXRanges(comp, options)
  debug('xrange', comp)
  comp = replaceStars(comp, options)
  debug('stars', comp)
  return comp
}

const isX = id => !id || id.toLowerCase() === 'x' || id === '*'

// ~, ~> --> * (any, kinda silly)
// ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0-0
// ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0-0
// ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0-0
// ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0-0
// ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0-0
const replaceTildes = (comp, options) =>
  comp.trim().split(/\s+/).map((comp) => {
    return replaceTilde(comp, options)
  }).join(' ')

const replaceTilde = (comp, options) => {
  const r = options.loose ? re[t.TILDELOOSE] : re[t.TILDE]
  return comp.replace(r, (_, M, m, p, pr) => {
    debug('tilde', comp, _, M, m, p, pr)
    let ret

    if (isX(M)) {
      ret = ''
    } else if (isX(m)) {
      ret = `>=${M}.0.0 <${+M + 1}.0.0-0`
    } else if (isX(p)) {
      // ~1.2 == >=1.2.0 <1.3.0-0
      ret = `>=${M}.${m}.0 <${M}.${+m + 1}.0-0`
    } else if (pr) {
      debug('replaceTilde pr', pr)
      ret = `>=${M}.${m}.${p}-${pr
      } <${M}.${+m + 1}.0-0`
    } else {
      // ~1.2.3 == >=1.2.3 <1.3.0-0
      ret = `>=${M}.${m}.${p
      } <${M}.${+m + 1}.0-0`
    }

    debug('tilde return', ret)
    return ret
  })
}

// ^ --> * (any, kinda silly)
// ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0-0
// ^2.0, ^2.0.x --> >=2.0.0 <3.0.0-0
// ^1.2, ^1.2.x --> >=1.2.0 <2.0.0-0
// ^1.2.3 --> >=1.2.3 <2.0.0-0
// ^1.2.0 --> >=1.2.0 <2.0.0-0
const replaceCarets = (comp, options) =>
  comp.trim().split(/\s+/).map((comp) => {
    return replaceCaret(comp, options)
  }).join(' ')

const replaceCaret = (comp, options) => {
  debug('caret', comp, options)
  const r = options.loose ? re[t.CARETLOOSE] : re[t.CARET]
  const z = options.includePrerelease ? '-0' : ''
  return comp.replace(r, (_, M, m, p, pr) => {
    debug('caret', comp, _, M, m, p, pr)
    let ret

    if (isX(M)) {
      ret = ''
    } else if (isX(m)) {
      ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`
    } else if (isX(p)) {
      if (M === '0') {
        ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`
      } else {
        ret = `>=${M}.${m}.0${z} <${+M + 1}.0.0-0`
      }
    } else if (pr) {
      debug('replaceCaret pr', pr)
      if (M === '0') {
        if (m === '0') {
          ret = `>=${M}.${m}.${p}-${pr
          } <${M}.${m}.${+p + 1}-0`
        } else {
          ret = `>=${M}.${m}.${p}-${pr
          } <${M}.${+m + 1}.0-0`
        }
      } else {
        ret = `>=${M}.${m}.${p}-${pr
        } <${+M + 1}.0.0-0`
      }
    } else {
      debug('no pr')
      if (M === '0') {
        if (m === '0') {
          ret = `>=${M}.${m}.${p
          }${z} <${M}.${m}.${+p + 1}-0`
        } else {
          ret = `>=${M}.${m}.${p
          }${z} <${M}.${+m + 1}.0-0`
        }
      } else {
        ret = `>=${M}.${m}.${p
        } <${+M + 1}.0.0-0`
      }
    }

    debug('caret return', ret)
    return ret
  })
}

const replaceXRanges = (comp, options) => {
  debug('replaceXRanges', comp, options)
  return comp.split(/\s+/).map((comp) => {
    return replaceXRange(comp, options)
  }).join(' ')
}

const replaceXRange = (comp, options) => {
  comp = comp.trim()
  const r = options.loose ? re[t.XRANGELOOSE] : re[t.XRANGE]
  return comp.replace(r, (ret, gtlt, M, m, p, pr) => {
    debug('xRange', comp, ret, gtlt, M, m, p, pr)
    const xM = isX(M)
    const xm = xM || isX(m)
    const xp = xm || isX(p)
    const anyX = xp

    if (gtlt === '=' && anyX) {
      gtlt = ''
    }

    // if we're including prereleases in the match, then we need
    // to fix this to -0, the lowest possible prerelease value
    pr = options.includePrerelease ? '-0' : ''

    if (xM) {
      if (gtlt === '>' || gtlt === '<') {
        // nothing is allowed
        ret = '<0.0.0-0'
      } else {
        // nothing is forbidden
        ret = '*'
      }
    } else if (gtlt && anyX) {
      // we know patch is an x, because we have any x at all.
      // replace X with 0
      if (xm) {
        m = 0
      }
      p = 0

      if (gtlt === '>') {
        // >1 => >=2.0.0
        // >1.2 => >=1.3.0
        gtlt = '>='
        if (xm) {
          M = +M + 1
          m = 0
          p = 0
        } else {
          m = +m + 1
          p = 0
        }
      } else if (gtlt === '<=') {
        // <=0.7.x is actually <0.8.0, since any 0.7.x should
        // pass.  Similarly, <=7.x is actually <8.0.0, etc.
        gtlt = '<'
        if (xm) {
          M = +M + 1
        } else {
          m = +m + 1
        }
      }

      if (gtlt === '<')
        pr = '-0'

      ret = `${gtlt + M}.${m}.${p}${pr}`
    } else if (xm) {
      ret = `>=${M}.0.0${pr} <${+M + 1}.0.0-0`
    } else if (xp) {
      ret = `>=${M}.${m}.0${pr
      } <${M}.${+m + 1}.0-0`
    }

    debug('xRange return', ret)

    return ret
  })
}

// Because * is AND-ed with everything else in the comparator,
// and '' means "any version", just remove the *s entirely.
const replaceStars = (comp, options) => {
  debug('replaceStars', comp, options)
  // Looseness is ignored here.  star is always as loose as it gets!
  return comp.trim().replace(re[t.STAR], '')
}

const replaceGTE0 = (comp, options) => {
  debug('replaceGTE0', comp, options)
  return comp.trim()
    .replace(re[options.includePrerelease ? t.GTE0PRE : t.GTE0], '')
}

// This function is passed to string.replace(re[t.HYPHENRANGE])
// M, m, patch, prerelease, build
// 1.2 - 3.4.5 => >=1.2.0 <=3.4.5
// 1.2.3 - 3.4 => >=1.2.0 <3.5.0-0 Any 3.4.x will do
// 1.2 - 3.4 => >=1.2.0 <3.5.0-0
const hyphenReplace = incPr => ($0,
  from, fM, fm, fp, fpr, fb,
  to, tM, tm, tp, tpr, tb) => {
  if (isX(fM)) {
    from = ''
  } else if (isX(fm)) {
    from = `>=${fM}.0.0${incPr ? '-0' : ''}`
  } else if (isX(fp)) {
    from = `>=${fM}.${fm}.0${incPr ? '-0' : ''}`
  } else if (fpr) {
    from = `>=${from}`
  } else {
    from = `>=${from}${incPr ? '-0' : ''}`
  }

  if (isX(tM)) {
    to = ''
  } else if (isX(tm)) {
    to = `<${+tM + 1}.0.0-0`
  } else if (isX(tp)) {
    to = `<${tM}.${+tm + 1}.0-0`
  } else if (tpr) {
    to = `<=${tM}.${tm}.${tp}-${tpr}`
  } else if (incPr) {
    to = `<${tM}.${tm}.${+tp + 1}-0`
  } else {
    to = `<=${to}`
  }

  return (`${from} ${to}`).trim()
}

const testSet = (set, version, options) => {
  for (let i = 0; i < set.length; i++) {
    if (!set[i].test(version)) {
      return false
    }
  }

  if (version.prerelease.length && !options.includePrerelease) {
    // Find the set of versions that are allowed to have prereleases
    // For example, ^1.2.3-pr.1 desugars to >=1.2.3-pr.1 <2.0.0
    // That should allow `1.2.3-pr.2` to pass.
    // However, `1.2.4-alpha.notready` should NOT be allowed,
    // even though it's within the range set by the comparators.
    for (let i = 0; i < set.length; i++) {
      debug(set[i].semver)
      if (set[i].semver === Comparator.ANY) {
        continue
      }

      if (set[i].semver.prerelease.length > 0) {
        const allowed = set[i].semver
        if (allowed.major === version.major &&
            allowed.minor === version.minor &&
            allowed.patch === version.patch) {
          return true
        }
      }
    }

    // Version has a -pre, but it's not one of the ones we like.
    return false
  }

  return true
}


/***/ }),

/***/ 9785:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const debug = __nccwpck_require__(1382)
const { MAX_LENGTH, MAX_SAFE_INTEGER } = __nccwpck_require__(3291)
const { re, t } = __nccwpck_require__(5412)

const parseOptions = __nccwpck_require__(1713)
const { compareIdentifiers } = __nccwpck_require__(5532)
class SemVer {
  constructor (version, options) {
    options = parseOptions(options)

    if (version instanceof SemVer) {
      if (version.loose === !!options.loose &&
          version.includePrerelease === !!options.includePrerelease) {
        return version
      } else {
        version = version.version
      }
    } else if (typeof version !== 'string') {
      throw new TypeError(`Invalid Version: ${version}`)
    }

    if (version.length > MAX_LENGTH) {
      throw new TypeError(
        `version is longer than ${MAX_LENGTH} characters`
      )
    }

    debug('SemVer', version, options)
    this.options = options
    this.loose = !!options.loose
    // this isn't actually relevant for versions, but keep it so that we
    // don't run into trouble passing this.options around.
    this.includePrerelease = !!options.includePrerelease

    const m = version.trim().match(options.loose ? re[t.LOOSE] : re[t.FULL])

    if (!m) {
      throw new TypeError(`Invalid Version: ${version}`)
    }

    this.raw = version

    // these are actually numbers
    this.major = +m[1]
    this.minor = +m[2]
    this.patch = +m[3]

    if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
      throw new TypeError('Invalid major version')
    }

    if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
      throw new TypeError('Invalid minor version')
    }

    if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
      throw new TypeError('Invalid patch version')
    }

    // numberify any prerelease numeric ids
    if (!m[4]) {
      this.prerelease = []
    } else {
      this.prerelease = m[4].split('.').map((id) => {
        if (/^[0-9]+$/.test(id)) {
          const num = +id
          if (num >= 0 && num < MAX_SAFE_INTEGER) {
            return num
          }
        }
        return id
      })
    }

    this.build = m[5] ? m[5].split('.') : []
    this.format()
  }

  format () {
    this.version = `${this.major}.${this.minor}.${this.patch}`
    if (this.prerelease.length) {
      this.version += `-${this.prerelease.join('.')}`
    }
    return this.version
  }

  toString () {
    return this.version
  }

  compare (other) {
    debug('SemVer.compare', this.version, this.options, other)
    if (!(other instanceof SemVer)) {
      if (typeof other === 'string' && other === this.version) {
        return 0
      }
      other = new SemVer(other, this.options)
    }

    if (other.version === this.version) {
      return 0
    }

    return this.compareMain(other) || this.comparePre(other)
  }

  compareMain (other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options)
    }

    return (
      compareIdentifiers(this.major, other.major) ||
      compareIdentifiers(this.minor, other.minor) ||
      compareIdentifiers(this.patch, other.patch)
    )
  }

  comparePre (other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options)
    }

    // NOT having a prerelease is > having one
    if (this.prerelease.length && !other.prerelease.length) {
      return -1
    } else if (!this.prerelease.length && other.prerelease.length) {
      return 1
    } else if (!this.prerelease.length && !other.prerelease.length) {
      return 0
    }

    let i = 0
    do {
      const a = this.prerelease[i]
      const b = other.prerelease[i]
      debug('prerelease compare', i, a, b)
      if (a === undefined && b === undefined) {
        return 0
      } else if (b === undefined) {
        return 1
      } else if (a === undefined) {
        return -1
      } else if (a === b) {
        continue
      } else {
        return compareIdentifiers(a, b)
      }
    } while (++i)
  }

  compareBuild (other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options)
    }

    let i = 0
    do {
      const a = this.build[i]
      const b = other.build[i]
      debug('prerelease compare', i, a, b)
      if (a === undefined && b === undefined) {
        return 0
      } else if (b === undefined) {
        return 1
      } else if (a === undefined) {
        return -1
      } else if (a === b) {
        continue
      } else {
        return compareIdentifiers(a, b)
      }
    } while (++i)
  }

  // preminor will bump the version up to the next minor release, and immediately
  // down to pre-release. premajor and prepatch work the same way.
  inc (release, identifier) {
    switch (release) {
      case 'premajor':
        this.prerelease.length = 0
        this.patch = 0
        this.minor = 0
        this.major++
        this.inc('pre', identifier)
        break
      case 'preminor':
        this.prerelease.length = 0
        this.patch = 0
        this.minor++
        this.inc('pre', identifier)
        break
      case 'prepatch':
        // If this is already a prerelease, it will bump to the next version
        // drop any prereleases that might already exist, since they are not
        // relevant at this point.
        this.prerelease.length = 0
        this.inc('patch', identifier)
        this.inc('pre', identifier)
        break
      // If the input is a non-prerelease version, this acts the same as
      // prepatch.
      case 'prerelease':
        if (this.prerelease.length === 0) {
          this.inc('patch', identifier)
        }
        this.inc('pre', identifier)
        break

      case 'major':
        // If this is a pre-major version, bump up to the same major version.
        // Otherwise increment major.
        // 1.0.0-5 bumps to 1.0.0
        // 1.1.0 bumps to 2.0.0
        if (
          this.minor !== 0 ||
          this.patch !== 0 ||
          this.prerelease.length === 0
        ) {
          this.major++
        }
        this.minor = 0
        this.patch = 0
        this.prerelease = []
        break
      case 'minor':
        // If this is a pre-minor version, bump up to the same minor version.
        // Otherwise increment minor.
        // 1.2.0-5 bumps to 1.2.0
        // 1.2.1 bumps to 1.3.0
        if (this.patch !== 0 || this.prerelease.length === 0) {
          this.minor++
        }
        this.patch = 0
        this.prerelease = []
        break
      case 'patch':
        // If this is not a pre-release version, it will increment the patch.
        // If it is a pre-release it will bump up to the same patch version.
        // 1.2.0-5 patches to 1.2.0
        // 1.2.0 patches to 1.2.1
        if (this.prerelease.length === 0) {
          this.patch++
        }
        this.prerelease = []
        break
      // This probably shouldn't be used publicly.
      // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
      case 'pre':
        if (this.prerelease.length === 0) {
          this.prerelease = [0]
        } else {
          let i = this.prerelease.length
          while (--i >= 0) {
            if (typeof this.prerelease[i] === 'number') {
              this.prerelease[i]++
              i = -2
            }
          }
          if (i === -1) {
            // didn't increment anything
            this.prerelease.push(0)
          }
        }
        if (identifier) {
          // 1.2.0-beta.1 bumps to 1.2.0-beta.2,
          // 1.2.0-beta.fooblz or 1.2.0-beta bumps to 1.2.0-beta.0
          if (this.prerelease[0] === identifier) {
            if (isNaN(this.prerelease[1])) {
              this.prerelease = [identifier, 0]
            }
          } else {
            this.prerelease = [identifier, 0]
          }
        }
        break

      default:
        throw new Error(`invalid increment argument: ${release}`)
    }
    this.format()
    this.raw = this.version
    return this
  }
}

module.exports = SemVer


/***/ }),

/***/ 7442:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const parse = __nccwpck_require__(7048)
const clean = (version, options) => {
  const s = parse(version.trim().replace(/^[=v]+/, ''), options)
  return s ? s.version : null
}
module.exports = clean


/***/ }),

/***/ 7929:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const eq = __nccwpck_require__(8778)
const neq = __nccwpck_require__(2610)
const gt = __nccwpck_require__(6778)
const gte = __nccwpck_require__(3638)
const lt = __nccwpck_require__(6548)
const lte = __nccwpck_require__(5865)

const cmp = (a, op, b, loose) => {
  switch (op) {
    case '===':
      if (typeof a === 'object')
        a = a.version
      if (typeof b === 'object')
        b = b.version
      return a === b

    case '!==':
      if (typeof a === 'object')
        a = a.version
      if (typeof b === 'object')
        b = b.version
      return a !== b

    case '':
    case '=':
    case '==':
      return eq(a, b, loose)

    case '!=':
      return neq(a, b, loose)

    case '>':
      return gt(a, b, loose)

    case '>=':
      return gte(a, b, loose)

    case '<':
      return lt(a, b, loose)

    case '<=':
      return lte(a, b, loose)

    default:
      throw new TypeError(`Invalid operator: ${op}`)
  }
}
module.exports = cmp


/***/ }),

/***/ 6769:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const SemVer = __nccwpck_require__(9785)
const parse = __nccwpck_require__(7048)
const {re, t} = __nccwpck_require__(5412)

const coerce = (version, options) => {
  if (version instanceof SemVer) {
    return version
  }

  if (typeof version === 'number') {
    version = String(version)
  }

  if (typeof version !== 'string') {
    return null
  }

  options = options || {}

  let match = null
  if (!options.rtl) {
    match = version.match(re[t.COERCE])
  } else {
    // Find the right-most coercible string that does not share
    // a terminus with a more left-ward coercible string.
    // Eg, '1.2.3.4' wants to coerce '2.3.4', not '3.4' or '4'
    //
    // Walk through the string checking with a /g regexp
    // Manually set the index so as to pick up overlapping matches.
    // Stop when we get a match that ends at the string end, since no
    // coercible string can be more right-ward without the same terminus.
    let next
    while ((next = re[t.COERCERTL].exec(version)) &&
        (!match || match.index + match[0].length !== version.length)
    ) {
      if (!match ||
            next.index + next[0].length !== match.index + match[0].length) {
        match = next
      }
      re[t.COERCERTL].lastIndex = next.index + next[1].length + next[2].length
    }
    // leave it in a clean state
    re[t.COERCERTL].lastIndex = -1
  }

  if (match === null)
    return null

  return parse(`${match[2]}.${match[3] || '0'}.${match[4] || '0'}`, options)
}
module.exports = coerce


/***/ }),

/***/ 5927:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const SemVer = __nccwpck_require__(9785)
const compareBuild = (a, b, loose) => {
  const versionA = new SemVer(a, loose)
  const versionB = new SemVer(b, loose)
  return versionA.compare(versionB) || versionA.compareBuild(versionB)
}
module.exports = compareBuild


/***/ }),

/***/ 4525:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const compare = __nccwpck_require__(3283)
const compareLoose = (a, b) => compare(a, b, true)
module.exports = compareLoose


/***/ }),

/***/ 3283:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const SemVer = __nccwpck_require__(9785)
const compare = (a, b, loose) =>
  new SemVer(a, loose).compare(new SemVer(b, loose))

module.exports = compare


/***/ }),

/***/ 7584:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const parse = __nccwpck_require__(7048)
const eq = __nccwpck_require__(8778)

const diff = (version1, version2) => {
  if (eq(version1, version2)) {
    return null
  } else {
    const v1 = parse(version1)
    const v2 = parse(version2)
    const hasPre = v1.prerelease.length || v2.prerelease.length
    const prefix = hasPre ? 'pre' : ''
    const defaultResult = hasPre ? 'prerelease' : ''
    for (const key in v1) {
      if (key === 'major' || key === 'minor' || key === 'patch') {
        if (v1[key] !== v2[key]) {
          return prefix + key
        }
      }
    }
    return defaultResult // may be undefined
  }
}
module.exports = diff


/***/ }),

/***/ 8778:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const compare = __nccwpck_require__(3283)
const eq = (a, b, loose) => compare(a, b, loose) === 0
module.exports = eq


/***/ }),

/***/ 6778:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const compare = __nccwpck_require__(3283)
const gt = (a, b, loose) => compare(a, b, loose) > 0
module.exports = gt


/***/ }),

/***/ 3638:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const compare = __nccwpck_require__(3283)
const gte = (a, b, loose) => compare(a, b, loose) >= 0
module.exports = gte


/***/ }),

/***/ 8453:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const SemVer = __nccwpck_require__(9785)

const inc = (version, release, options, identifier) => {
  if (typeof (options) === 'string') {
    identifier = options
    options = undefined
  }

  try {
    return new SemVer(version, options).inc(release, identifier).version
  } catch (er) {
    return null
  }
}
module.exports = inc


/***/ }),

/***/ 6548:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const compare = __nccwpck_require__(3283)
const lt = (a, b, loose) => compare(a, b, loose) < 0
module.exports = lt


/***/ }),

/***/ 5865:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const compare = __nccwpck_require__(3283)
const lte = (a, b, loose) => compare(a, b, loose) <= 0
module.exports = lte


/***/ }),

/***/ 2712:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const SemVer = __nccwpck_require__(9785)
const major = (a, loose) => new SemVer(a, loose).major
module.exports = major


/***/ }),

/***/ 4598:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const SemVer = __nccwpck_require__(9785)
const minor = (a, loose) => new SemVer(a, loose).minor
module.exports = minor


/***/ }),

/***/ 2610:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const compare = __nccwpck_require__(3283)
const neq = (a, b, loose) => compare(a, b, loose) !== 0
module.exports = neq


/***/ }),

/***/ 7048:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const {MAX_LENGTH} = __nccwpck_require__(3291)
const { re, t } = __nccwpck_require__(5412)
const SemVer = __nccwpck_require__(9785)

const parseOptions = __nccwpck_require__(1713)
const parse = (version, options) => {
  options = parseOptions(options)

  if (version instanceof SemVer) {
    return version
  }

  if (typeof version !== 'string') {
    return null
  }

  if (version.length > MAX_LENGTH) {
    return null
  }

  const r = options.loose ? re[t.LOOSE] : re[t.FULL]
  if (!r.test(version)) {
    return null
  }

  try {
    return new SemVer(version, options)
  } catch (er) {
    return null
  }
}

module.exports = parse


/***/ }),

/***/ 4925:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const SemVer = __nccwpck_require__(9785)
const patch = (a, loose) => new SemVer(a, loose).patch
module.exports = patch


/***/ }),

/***/ 9973:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const parse = __nccwpck_require__(7048)
const prerelease = (version, options) => {
  const parsed = parse(version, options)
  return (parsed && parsed.prerelease.length) ? parsed.prerelease : null
}
module.exports = prerelease


/***/ }),

/***/ 8321:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const compare = __nccwpck_require__(3283)
const rcompare = (a, b, loose) => compare(b, a, loose)
module.exports = rcompare


/***/ }),

/***/ 8288:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const compareBuild = __nccwpck_require__(5927)
const rsort = (list, loose) => list.sort((a, b) => compareBuild(b, a, loose))
module.exports = rsort


/***/ }),

/***/ 2929:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const Range = __nccwpck_require__(5058)
const satisfies = (version, range, options) => {
  try {
    range = new Range(range, options)
  } catch (er) {
    return false
  }
  return range.test(version)
}
module.exports = satisfies


/***/ }),

/***/ 9607:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const compareBuild = __nccwpck_require__(5927)
const sort = (list, loose) => list.sort((a, b) => compareBuild(a, b, loose))
module.exports = sort


/***/ }),

/***/ 3856:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const parse = __nccwpck_require__(7048)
const valid = (version, options) => {
  const v = parse(version, options)
  return v ? v.version : null
}
module.exports = valid


/***/ }),

/***/ 7753:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

// just pre-load all the stuff that index.js lazily exports
const internalRe = __nccwpck_require__(5412)
module.exports = {
  re: internalRe.re,
  src: internalRe.src,
  tokens: internalRe.t,
  SEMVER_SPEC_VERSION: __nccwpck_require__(3291).SEMVER_SPEC_VERSION,
  SemVer: __nccwpck_require__(9785),
  compareIdentifiers: __nccwpck_require__(5532).compareIdentifiers,
  rcompareIdentifiers: __nccwpck_require__(5532).rcompareIdentifiers,
  parse: __nccwpck_require__(7048),
  valid: __nccwpck_require__(3856),
  clean: __nccwpck_require__(7442),
  inc: __nccwpck_require__(8453),
  diff: __nccwpck_require__(7584),
  major: __nccwpck_require__(2712),
  minor: __nccwpck_require__(4598),
  patch: __nccwpck_require__(4925),
  prerelease: __nccwpck_require__(9973),
  compare: __nccwpck_require__(3283),
  rcompare: __nccwpck_require__(8321),
  compareLoose: __nccwpck_require__(4525),
  compareBuild: __nccwpck_require__(5927),
  sort: __nccwpck_require__(9607),
  rsort: __nccwpck_require__(8288),
  gt: __nccwpck_require__(6778),
  lt: __nccwpck_require__(6548),
  eq: __nccwpck_require__(8778),
  neq: __nccwpck_require__(2610),
  gte: __nccwpck_require__(3638),
  lte: __nccwpck_require__(5865),
  cmp: __nccwpck_require__(7929),
  coerce: __nccwpck_require__(6769),
  Comparator: __nccwpck_require__(9972),
  Range: __nccwpck_require__(5058),
  satisfies: __nccwpck_require__(2929),
  toComparators: __nccwpck_require__(1337),
  maxSatisfying: __nccwpck_require__(7591),
  minSatisfying: __nccwpck_require__(3645),
  minVersion: __nccwpck_require__(875),
  validRange: __nccwpck_require__(2746),
  outside: __nccwpck_require__(1680),
  gtr: __nccwpck_require__(558),
  ltr: __nccwpck_require__(7347),
  intersects: __nccwpck_require__(5430),
  simplifyRange: __nccwpck_require__(5650),
  subset: __nccwpck_require__(5326),
}


/***/ }),

/***/ 3291:
/***/ ((module) => {

// Note: this is the semver.org version of the spec that it implements
// Not necessarily the package version of this code.
const SEMVER_SPEC_VERSION = '2.0.0'

const MAX_LENGTH = 256
const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER ||
  /* istanbul ignore next */ 9007199254740991

// Max safe segment length for coercion.
const MAX_SAFE_COMPONENT_LENGTH = 16

module.exports = {
  SEMVER_SPEC_VERSION,
  MAX_LENGTH,
  MAX_SAFE_INTEGER,
  MAX_SAFE_COMPONENT_LENGTH
}


/***/ }),

/***/ 1382:
/***/ ((module) => {

const debug = (
  typeof process === 'object' &&
  process.env &&
  process.env.NODE_DEBUG &&
  /\bsemver\b/i.test(process.env.NODE_DEBUG)
) ? (...args) => console.error('SEMVER', ...args)
  : () => {}

module.exports = debug


/***/ }),

/***/ 5532:
/***/ ((module) => {

const numeric = /^[0-9]+$/
const compareIdentifiers = (a, b) => {
  const anum = numeric.test(a)
  const bnum = numeric.test(b)

  if (anum && bnum) {
    a = +a
    b = +b
  }

  return a === b ? 0
    : (anum && !bnum) ? -1
    : (bnum && !anum) ? 1
    : a < b ? -1
    : 1
}

const rcompareIdentifiers = (a, b) => compareIdentifiers(b, a)

module.exports = {
  compareIdentifiers,
  rcompareIdentifiers
}


/***/ }),

/***/ 1713:
/***/ ((module) => {

// parse out just the options we care about so we always get a consistent
// obj with keys in a consistent order.
const opts = ['includePrerelease', 'loose', 'rtl']
const parseOptions = options =>
  !options ? {}
  : typeof options !== 'object' ? { loose: true }
  : opts.filter(k => options[k]).reduce((options, k) => {
    options[k] = true
    return options
  }, {})
module.exports = parseOptions


/***/ }),

/***/ 5412:
/***/ ((module, exports, __nccwpck_require__) => {

const { MAX_SAFE_COMPONENT_LENGTH } = __nccwpck_require__(3291)
const debug = __nccwpck_require__(1382)
exports = module.exports = {}

// The actual regexps go on exports.re
const re = exports.re = []
const src = exports.src = []
const t = exports.t = {}
let R = 0

const createToken = (name, value, isGlobal) => {
  const index = R++
  debug(index, value)
  t[name] = index
  src[index] = value
  re[index] = new RegExp(value, isGlobal ? 'g' : undefined)
}

// The following Regular Expressions can be used for tokenizing,
// validating, and parsing SemVer version strings.

// ## Numeric Identifier
// A single `0`, or a non-zero digit followed by zero or more digits.

createToken('NUMERICIDENTIFIER', '0|[1-9]\\d*')
createToken('NUMERICIDENTIFIERLOOSE', '[0-9]+')

// ## Non-numeric Identifier
// Zero or more digits, followed by a letter or hyphen, and then zero or
// more letters, digits, or hyphens.

createToken('NONNUMERICIDENTIFIER', '\\d*[a-zA-Z-][a-zA-Z0-9-]*')

// ## Main Version
// Three dot-separated numeric identifiers.

createToken('MAINVERSION', `(${src[t.NUMERICIDENTIFIER]})\\.` +
                   `(${src[t.NUMERICIDENTIFIER]})\\.` +
                   `(${src[t.NUMERICIDENTIFIER]})`)

createToken('MAINVERSIONLOOSE', `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.` +
                        `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.` +
                        `(${src[t.NUMERICIDENTIFIERLOOSE]})`)

// ## Pre-release Version Identifier
// A numeric identifier, or a non-numeric identifier.

createToken('PRERELEASEIDENTIFIER', `(?:${src[t.NUMERICIDENTIFIER]
}|${src[t.NONNUMERICIDENTIFIER]})`)

createToken('PRERELEASEIDENTIFIERLOOSE', `(?:${src[t.NUMERICIDENTIFIERLOOSE]
}|${src[t.NONNUMERICIDENTIFIER]})`)

// ## Pre-release Version
// Hyphen, followed by one or more dot-separated pre-release version
// identifiers.

createToken('PRERELEASE', `(?:-(${src[t.PRERELEASEIDENTIFIER]
}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`)

createToken('PRERELEASELOOSE', `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]
}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`)

// ## Build Metadata Identifier
// Any combination of digits, letters, or hyphens.

createToken('BUILDIDENTIFIER', '[0-9A-Za-z-]+')

// ## Build Metadata
// Plus sign, followed by one or more period-separated build metadata
// identifiers.

createToken('BUILD', `(?:\\+(${src[t.BUILDIDENTIFIER]
}(?:\\.${src[t.BUILDIDENTIFIER]})*))`)

// ## Full Version String
// A main version, followed optionally by a pre-release version and
// build metadata.

// Note that the only major, minor, patch, and pre-release sections of
// the version string are capturing groups.  The build metadata is not a
// capturing group, because it should not ever be used in version
// comparison.

createToken('FULLPLAIN', `v?${src[t.MAINVERSION]
}${src[t.PRERELEASE]}?${
  src[t.BUILD]}?`)

createToken('FULL', `^${src[t.FULLPLAIN]}$`)

// like full, but allows v1.2.3 and =1.2.3, which people do sometimes.
// also, 1.0.0alpha1 (prerelease without the hyphen) which is pretty
// common in the npm registry.
createToken('LOOSEPLAIN', `[v=\\s]*${src[t.MAINVERSIONLOOSE]
}${src[t.PRERELEASELOOSE]}?${
  src[t.BUILD]}?`)

createToken('LOOSE', `^${src[t.LOOSEPLAIN]}$`)

createToken('GTLT', '((?:<|>)?=?)')

// Something like "2.*" or "1.2.x".
// Note that "x.x" is a valid xRange identifer, meaning "any version"
// Only the first item is strictly required.
createToken('XRANGEIDENTIFIERLOOSE', `${src[t.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`)
createToken('XRANGEIDENTIFIER', `${src[t.NUMERICIDENTIFIER]}|x|X|\\*`)

createToken('XRANGEPLAIN', `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})` +
                   `(?:\\.(${src[t.XRANGEIDENTIFIER]})` +
                   `(?:\\.(${src[t.XRANGEIDENTIFIER]})` +
                   `(?:${src[t.PRERELEASE]})?${
                     src[t.BUILD]}?` +
                   `)?)?`)

createToken('XRANGEPLAINLOOSE', `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})` +
                        `(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})` +
                        `(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})` +
                        `(?:${src[t.PRERELEASELOOSE]})?${
                          src[t.BUILD]}?` +
                        `)?)?`)

createToken('XRANGE', `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`)
createToken('XRANGELOOSE', `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`)

// Coercion.
// Extract anything that could conceivably be a part of a valid semver
createToken('COERCE', `${'(^|[^\\d])' +
              '(\\d{1,'}${MAX_SAFE_COMPONENT_LENGTH}})` +
              `(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?` +
              `(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?` +
              `(?:$|[^\\d])`)
createToken('COERCERTL', src[t.COERCE], true)

// Tilde ranges.
// Meaning is "reasonably at or greater than"
createToken('LONETILDE', '(?:~>?)')

createToken('TILDETRIM', `(\\s*)${src[t.LONETILDE]}\\s+`, true)
exports.tildeTrimReplace = '$1~'

createToken('TILDE', `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`)
createToken('TILDELOOSE', `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`)

// Caret ranges.
// Meaning is "at least and backwards compatible with"
createToken('LONECARET', '(?:\\^)')

createToken('CARETTRIM', `(\\s*)${src[t.LONECARET]}\\s+`, true)
exports.caretTrimReplace = '$1^'

createToken('CARET', `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`)
createToken('CARETLOOSE', `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`)

// A simple gt/lt/eq thing, or just "" to indicate "any version"
createToken('COMPARATORLOOSE', `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`)
createToken('COMPARATOR', `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`)

// An expression to strip any whitespace between the gtlt and the thing
// it modifies, so that `> 1.2.3` ==> `>1.2.3`
createToken('COMPARATORTRIM', `(\\s*)${src[t.GTLT]
}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`, true)
exports.comparatorTrimReplace = '$1$2$3'

// Something like `1.2.3 - 1.2.4`
// Note that these all use the loose form, because they'll be
// checked against either the strict or loose comparator form
// later.
createToken('HYPHENRANGE', `^\\s*(${src[t.XRANGEPLAIN]})` +
                   `\\s+-\\s+` +
                   `(${src[t.XRANGEPLAIN]})` +
                   `\\s*$`)

createToken('HYPHENRANGELOOSE', `^\\s*(${src[t.XRANGEPLAINLOOSE]})` +
                        `\\s+-\\s+` +
                        `(${src[t.XRANGEPLAINLOOSE]})` +
                        `\\s*$`)

// Star ranges basically just allow anything at all.
createToken('STAR', '(<|>)?=?\\s*\\*')
// >=0.0.0 is like a star
createToken('GTE0', '^\\s*>=\\s*0\.0\.0\\s*$')
createToken('GTE0PRE', '^\\s*>=\\s*0\.0\.0-0\\s*$')


/***/ }),

/***/ 558:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

// Determine if version is greater than all the versions possible in the range.
const outside = __nccwpck_require__(1680)
const gtr = (version, range, options) => outside(version, range, '>', options)
module.exports = gtr


/***/ }),

/***/ 5430:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const Range = __nccwpck_require__(5058)
const intersects = (r1, r2, options) => {
  r1 = new Range(r1, options)
  r2 = new Range(r2, options)
  return r1.intersects(r2)
}
module.exports = intersects


/***/ }),

/***/ 7347:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const outside = __nccwpck_require__(1680)
// Determine if version is less than all the versions possible in the range
const ltr = (version, range, options) => outside(version, range, '<', options)
module.exports = ltr


/***/ }),

/***/ 7591:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const SemVer = __nccwpck_require__(9785)
const Range = __nccwpck_require__(5058)

const maxSatisfying = (versions, range, options) => {
  let max = null
  let maxSV = null
  let rangeObj = null
  try {
    rangeObj = new Range(range, options)
  } catch (er) {
    return null
  }
  versions.forEach((v) => {
    if (rangeObj.test(v)) {
      // satisfies(v, range, options)
      if (!max || maxSV.compare(v) === -1) {
        // compare(max, v, true)
        max = v
        maxSV = new SemVer(max, options)
      }
    }
  })
  return max
}
module.exports = maxSatisfying


/***/ }),

/***/ 3645:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const SemVer = __nccwpck_require__(9785)
const Range = __nccwpck_require__(5058)
const minSatisfying = (versions, range, options) => {
  let min = null
  let minSV = null
  let rangeObj = null
  try {
    rangeObj = new Range(range, options)
  } catch (er) {
    return null
  }
  versions.forEach((v) => {
    if (rangeObj.test(v)) {
      // satisfies(v, range, options)
      if (!min || minSV.compare(v) === 1) {
        // compare(min, v, true)
        min = v
        minSV = new SemVer(min, options)
      }
    }
  })
  return min
}
module.exports = minSatisfying


/***/ }),

/***/ 875:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const SemVer = __nccwpck_require__(9785)
const Range = __nccwpck_require__(5058)
const gt = __nccwpck_require__(6778)

const minVersion = (range, loose) => {
  range = new Range(range, loose)

  let minver = new SemVer('0.0.0')
  if (range.test(minver)) {
    return minver
  }

  minver = new SemVer('0.0.0-0')
  if (range.test(minver)) {
    return minver
  }

  minver = null
  for (let i = 0; i < range.set.length; ++i) {
    const comparators = range.set[i]

    let setMin = null
    comparators.forEach((comparator) => {
      // Clone to avoid manipulating the comparator's semver object.
      const compver = new SemVer(comparator.semver.version)
      switch (comparator.operator) {
        case '>':
          if (compver.prerelease.length === 0) {
            compver.patch++
          } else {
            compver.prerelease.push(0)
          }
          compver.raw = compver.format()
          /* fallthrough */
        case '':
        case '>=':
          if (!setMin || gt(compver, setMin)) {
            setMin = compver
          }
          break
        case '<':
        case '<=':
          /* Ignore maximum versions */
          break
        /* istanbul ignore next */
        default:
          throw new Error(`Unexpected operation: ${comparator.operator}`)
      }
    })
    if (setMin && (!minver || gt(minver, setMin)))
      minver = setMin
  }

  if (minver && range.test(minver)) {
    return minver
  }

  return null
}
module.exports = minVersion


/***/ }),

/***/ 1680:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const SemVer = __nccwpck_require__(9785)
const Comparator = __nccwpck_require__(9972)
const {ANY} = Comparator
const Range = __nccwpck_require__(5058)
const satisfies = __nccwpck_require__(2929)
const gt = __nccwpck_require__(6778)
const lt = __nccwpck_require__(6548)
const lte = __nccwpck_require__(5865)
const gte = __nccwpck_require__(3638)

const outside = (version, range, hilo, options) => {
  version = new SemVer(version, options)
  range = new Range(range, options)

  let gtfn, ltefn, ltfn, comp, ecomp
  switch (hilo) {
    case '>':
      gtfn = gt
      ltefn = lte
      ltfn = lt
      comp = '>'
      ecomp = '>='
      break
    case '<':
      gtfn = lt
      ltefn = gte
      ltfn = gt
      comp = '<'
      ecomp = '<='
      break
    default:
      throw new TypeError('Must provide a hilo val of "<" or ">"')
  }

  // If it satisfies the range it is not outside
  if (satisfies(version, range, options)) {
    return false
  }

  // From now on, variable terms are as if we're in "gtr" mode.
  // but note that everything is flipped for the "ltr" function.

  for (let i = 0; i < range.set.length; ++i) {
    const comparators = range.set[i]

    let high = null
    let low = null

    comparators.forEach((comparator) => {
      if (comparator.semver === ANY) {
        comparator = new Comparator('>=0.0.0')
      }
      high = high || comparator
      low = low || comparator
      if (gtfn(comparator.semver, high.semver, options)) {
        high = comparator
      } else if (ltfn(comparator.semver, low.semver, options)) {
        low = comparator
      }
    })

    // If the edge version comparator has a operator then our version
    // isn't outside it
    if (high.operator === comp || high.operator === ecomp) {
      return false
    }

    // If the lowest version comparator has an operator and our version
    // is less than it then it isn't higher than the range
    if ((!low.operator || low.operator === comp) &&
        ltefn(version, low.semver)) {
      return false
    } else if (low.operator === ecomp && ltfn(version, low.semver)) {
      return false
    }
  }
  return true
}

module.exports = outside


/***/ }),

/***/ 5650:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

// given a set of versions and a range, create a "simplified" range
// that includes the same versions that the original range does
// If the original range is shorter than the simplified one, return that.
const satisfies = __nccwpck_require__(2929)
const compare = __nccwpck_require__(3283)
module.exports = (versions, range, options) => {
  const set = []
  let min = null
  let prev = null
  const v = versions.sort((a, b) => compare(a, b, options))
  for (const version of v) {
    const included = satisfies(version, range, options)
    if (included) {
      prev = version
      if (!min)
        min = version
    } else {
      if (prev) {
        set.push([min, prev])
      }
      prev = null
      min = null
    }
  }
  if (min)
    set.push([min, null])

  const ranges = []
  for (const [min, max] of set) {
    if (min === max)
      ranges.push(min)
    else if (!max && min === v[0])
      ranges.push('*')
    else if (!max)
      ranges.push(`>=${min}`)
    else if (min === v[0])
      ranges.push(`<=${max}`)
    else
      ranges.push(`${min} - ${max}`)
  }
  const simplified = ranges.join(' || ')
  const original = typeof range.raw === 'string' ? range.raw : String(range)
  return simplified.length < original.length ? simplified : range
}


/***/ }),

/***/ 5326:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const Range = __nccwpck_require__(5058)
const Comparator = __nccwpck_require__(9972)
const { ANY } = Comparator
const satisfies = __nccwpck_require__(2929)
const compare = __nccwpck_require__(3283)

// Complex range `r1 || r2 || ...` is a subset of `R1 || R2 || ...` iff:
// - Every simple range `r1, r2, ...` is a null set, OR
// - Every simple range `r1, r2, ...` which is not a null set is a subset of
//   some `R1, R2, ...`
//
// Simple range `c1 c2 ...` is a subset of simple range `C1 C2 ...` iff:
// - If c is only the ANY comparator
//   - If C is only the ANY comparator, return true
//   - Else if in prerelease mode, return false
//   - else replace c with `[>=0.0.0]`
// - If C is only the ANY comparator
//   - if in prerelease mode, return true
//   - else replace C with `[>=0.0.0]`
// - Let EQ be the set of = comparators in c
// - If EQ is more than one, return true (null set)
// - Let GT be the highest > or >= comparator in c
// - Let LT be the lowest < or <= comparator in c
// - If GT and LT, and GT.semver > LT.semver, return true (null set)
// - If any C is a = range, and GT or LT are set, return false
// - If EQ
//   - If GT, and EQ does not satisfy GT, return true (null set)
//   - If LT, and EQ does not satisfy LT, return true (null set)
//   - If EQ satisfies every C, return true
//   - Else return false
// - If GT
//   - If GT.semver is lower than any > or >= comp in C, return false
//   - If GT is >=, and GT.semver does not satisfy every C, return false
//   - If GT.semver has a prerelease, and not in prerelease mode
//     - If no C has a prerelease and the GT.semver tuple, return false
// - If LT
//   - If LT.semver is greater than any < or <= comp in C, return false
//   - If LT is <=, and LT.semver does not satisfy every C, return false
//   - If GT.semver has a prerelease, and not in prerelease mode
//     - If no C has a prerelease and the LT.semver tuple, return false
// - Else return true

const subset = (sub, dom, options = {}) => {
  if (sub === dom)
    return true

  sub = new Range(sub, options)
  dom = new Range(dom, options)
  let sawNonNull = false

  OUTER: for (const simpleSub of sub.set) {
    for (const simpleDom of dom.set) {
      const isSub = simpleSubset(simpleSub, simpleDom, options)
      sawNonNull = sawNonNull || isSub !== null
      if (isSub)
        continue OUTER
    }
    // the null set is a subset of everything, but null simple ranges in
    // a complex range should be ignored.  so if we saw a non-null range,
    // then we know this isn't a subset, but if EVERY simple range was null,
    // then it is a subset.
    if (sawNonNull)
      return false
  }
  return true
}

const simpleSubset = (sub, dom, options) => {
  if (sub === dom)
    return true

  if (sub.length === 1 && sub[0].semver === ANY) {
    if (dom.length === 1 && dom[0].semver === ANY)
      return true
    else if (options.includePrerelease)
      sub = [ new Comparator('>=0.0.0-0') ]
    else
      sub = [ new Comparator('>=0.0.0') ]
  }

  if (dom.length === 1 && dom[0].semver === ANY) {
    if (options.includePrerelease)
      return true
    else
      dom = [ new Comparator('>=0.0.0') ]
  }

  const eqSet = new Set()
  let gt, lt
  for (const c of sub) {
    if (c.operator === '>' || c.operator === '>=')
      gt = higherGT(gt, c, options)
    else if (c.operator === '<' || c.operator === '<=')
      lt = lowerLT(lt, c, options)
    else
      eqSet.add(c.semver)
  }

  if (eqSet.size > 1)
    return null

  let gtltComp
  if (gt && lt) {
    gtltComp = compare(gt.semver, lt.semver, options)
    if (gtltComp > 0)
      return null
    else if (gtltComp === 0 && (gt.operator !== '>=' || lt.operator !== '<='))
      return null
  }

  // will iterate one or zero times
  for (const eq of eqSet) {
    if (gt && !satisfies(eq, String(gt), options))
      return null

    if (lt && !satisfies(eq, String(lt), options))
      return null

    for (const c of dom) {
      if (!satisfies(eq, String(c), options))
        return false
    }

    return true
  }

  let higher, lower
  let hasDomLT, hasDomGT
  // if the subset has a prerelease, we need a comparator in the superset
  // with the same tuple and a prerelease, or it's not a subset
  let needDomLTPre = lt &&
    !options.includePrerelease &&
    lt.semver.prerelease.length ? lt.semver : false
  let needDomGTPre = gt &&
    !options.includePrerelease &&
    gt.semver.prerelease.length ? gt.semver : false
  // exception: <1.2.3-0 is the same as <1.2.3
  if (needDomLTPre && needDomLTPre.prerelease.length === 1 &&
      lt.operator === '<' && needDomLTPre.prerelease[0] === 0) {
    needDomLTPre = false
  }

  for (const c of dom) {
    hasDomGT = hasDomGT || c.operator === '>' || c.operator === '>='
    hasDomLT = hasDomLT || c.operator === '<' || c.operator === '<='
    if (gt) {
      if (needDomGTPre) {
        if (c.semver.prerelease && c.semver.prerelease.length &&
            c.semver.major === needDomGTPre.major &&
            c.semver.minor === needDomGTPre.minor &&
            c.semver.patch === needDomGTPre.patch) {
          needDomGTPre = false
        }
      }
      if (c.operator === '>' || c.operator === '>=') {
        higher = higherGT(gt, c, options)
        if (higher === c && higher !== gt)
          return false
      } else if (gt.operator === '>=' && !satisfies(gt.semver, String(c), options))
        return false
    }
    if (lt) {
      if (needDomLTPre) {
        if (c.semver.prerelease && c.semver.prerelease.length &&
            c.semver.major === needDomLTPre.major &&
            c.semver.minor === needDomLTPre.minor &&
            c.semver.patch === needDomLTPre.patch) {
          needDomLTPre = false
        }
      }
      if (c.operator === '<' || c.operator === '<=') {
        lower = lowerLT(lt, c, options)
        if (lower === c && lower !== lt)
          return false
      } else if (lt.operator === '<=' && !satisfies(lt.semver, String(c), options))
        return false
    }
    if (!c.operator && (lt || gt) && gtltComp !== 0)
      return false
  }

  // if there was a < or >, and nothing in the dom, then must be false
  // UNLESS it was limited by another range in the other direction.
  // Eg, >1.0.0 <1.0.1 is still a subset of <2.0.0
  if (gt && hasDomLT && !lt && gtltComp !== 0)
    return false

  if (lt && hasDomGT && !gt && gtltComp !== 0)
    return false

  // we needed a prerelease range in a specific tuple, but didn't get one
  // then this isn't a subset.  eg >=1.2.3-pre is not a subset of >=1.0.0,
  // because it includes prereleases in the 1.2.3 tuple
  if (needDomGTPre || needDomLTPre)
    return false

  return true
}

// >=1.2.3 is lower than >1.2.3
const higherGT = (a, b, options) => {
  if (!a)
    return b
  const comp = compare(a.semver, b.semver, options)
  return comp > 0 ? a
    : comp < 0 ? b
    : b.operator === '>' && a.operator === '>=' ? b
    : a
}

// <=1.2.3 is higher than <1.2.3
const lowerLT = (a, b, options) => {
  if (!a)
    return b
  const comp = compare(a.semver, b.semver, options)
  return comp < 0 ? a
    : comp > 0 ? b
    : b.operator === '<' && a.operator === '<=' ? b
    : a
}

module.exports = subset


/***/ }),

/***/ 1337:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const Range = __nccwpck_require__(5058)

// Mostly just for testing and legacy API reasons
const toComparators = (range, options) =>
  new Range(range, options).set
    .map(comp => comp.map(c => c.value).join(' ').trim().split(' '))

module.exports = toComparators


/***/ }),

/***/ 2746:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const Range = __nccwpck_require__(5058)
const validRange = (range, options) => {
  try {
    // Return '*' instead of '' so that truthiness works.
    // This will throw if it's invalid anyway
    return new Range(range, options).range || '*'
  } catch (er) {
    return null
  }
}
module.exports = validRange


/***/ }),

/***/ 3120:
/***/ ((module) => {

"use strict";
/*! https://mths.be/cssesc v3.0.0 by @mathias */


var object = {};
var hasOwnProperty = object.hasOwnProperty;
var merge = function merge(options, defaults) {
	if (!options) {
		return defaults;
	}
	var result = {};
	for (var key in defaults) {
		// `if (defaults.hasOwnProperty(key) { … }` is not needed here, since
		// only recognized option names are used.
		result[key] = hasOwnProperty.call(options, key) ? options[key] : defaults[key];
	}
	return result;
};

var regexAnySingleEscape = /[ -,\.\/:-@\[-\^`\{-~]/;
var regexSingleEscape = /[ -,\.\/:-@\[\]\^`\{-~]/;
var regexAlwaysEscape = /['"\\]/;
var regexExcessiveSpaces = /(^|\\+)?(\\[A-F0-9]{1,6})\x20(?![a-fA-F0-9\x20])/g;

// https://mathiasbynens.be/notes/css-escapes#css
var cssesc = function cssesc(string, options) {
	options = merge(options, cssesc.options);
	if (options.quotes != 'single' && options.quotes != 'double') {
		options.quotes = 'single';
	}
	var quote = options.quotes == 'double' ? '"' : '\'';
	var isIdentifier = options.isIdentifier;

	var firstChar = string.charAt(0);
	var output = '';
	var counter = 0;
	var length = string.length;
	while (counter < length) {
		var character = string.charAt(counter++);
		var codePoint = character.charCodeAt();
		var value = void 0;
		// If it’s not a printable ASCII character…
		if (codePoint < 0x20 || codePoint > 0x7E) {
			if (codePoint >= 0xD800 && codePoint <= 0xDBFF && counter < length) {
				// It’s a high surrogate, and there is a next character.
				var extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) {
					// next character is low surrogate
					codePoint = ((codePoint & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000;
				} else {
					// It’s an unmatched surrogate; only append this code unit, in case
					// the next code unit is the high surrogate of a surrogate pair.
					counter--;
				}
			}
			value = '\\' + codePoint.toString(16).toUpperCase() + ' ';
		} else {
			if (options.escapeEverything) {
				if (regexAnySingleEscape.test(character)) {
					value = '\\' + character;
				} else {
					value = '\\' + codePoint.toString(16).toUpperCase() + ' ';
				}
			} else if (/[\t\n\f\r\x0B]/.test(character)) {
				value = '\\' + codePoint.toString(16).toUpperCase() + ' ';
			} else if (character == '\\' || !isIdentifier && (character == '"' && quote == character || character == '\'' && quote == character) || isIdentifier && regexSingleEscape.test(character)) {
				value = '\\' + character;
			} else {
				value = character;
			}
		}
		output += value;
	}

	if (isIdentifier) {
		if (/^-[-\d]/.test(output)) {
			output = '\\-' + output.slice(1);
		} else if (/\d/.test(firstChar)) {
			output = '\\3' + firstChar + ' ' + output.slice(1);
		}
	}

	// Remove spaces after `\HEX` escapes that are not followed by a hex digit,
	// since they’re redundant. Note that this is only possible if the escape
	// sequence isn’t preceded by an odd number of backslashes.
	output = output.replace(regexExcessiveSpaces, function ($0, $1, $2) {
		if ($1 && $1.length % 2) {
			// It’s not safe to remove the space, so don’t.
			return $0;
		}
		// Strip the space.
		return ($1 || '') + $2;
	});

	if (!isIdentifier && options.wrap) {
		return quote + output + quote;
	}
	return output;
};

// Expose default options (so they can be overridden globally).
cssesc.options = {
	'escapeEverything': false,
	'isIdentifier': false,
	'quotes': 'single',
	'wrap': false
};

cssesc.version = '3.0.0';

module.exports = cssesc;


/***/ }),

/***/ 3887:
/***/ ((module) => {

module.exports = [
  "🀄️",
  "🃏",
  "🅰️",
  "🅱️",
  "🅾️",
  "🅿️",
  "🆎",
  "🆑",
  "🆒",
  "🆓",
  "🆔",
  "🆕",
  "🆖",
  "🆗",
  "🆘",
  "🆙",
  "🆚",
  "🇦🇨",
  "🇦🇩",
  "🇦🇪",
  "🇦🇫",
  "🇦🇬",
  "🇦🇮",
  "🇦🇱",
  "🇦🇲",
  "🇦🇴",
  "🇦🇶",
  "🇦🇷",
  "🇦🇸",
  "🇦🇹",
  "🇦🇺",
  "🇦🇼",
  "🇦🇽",
  "🇦🇿",
  "🇦",
  "🇧🇦",
  "🇧🇧",
  "🇧🇩",
  "🇧🇪",
  "🇧🇫",
  "🇧🇬",
  "🇧🇭",
  "🇧🇮",
  "🇧🇯",
  "🇧🇱",
  "🇧🇲",
  "🇧🇳",
  "🇧🇴",
  "🇧🇶",
  "🇧🇷",
  "🇧🇸",
  "🇧🇹",
  "🇧🇻",
  "🇧🇼",
  "🇧🇾",
  "🇧🇿",
  "🇧",
  "🇨🇦",
  "🇨🇨",
  "🇨🇩",
  "🇨🇫",
  "🇨🇬",
  "🇨🇭",
  "🇨🇮",
  "🇨🇰",
  "🇨🇱",
  "🇨🇲",
  "🇨🇳",
  "🇨🇴",
  "🇨🇵",
  "🇨🇷",
  "🇨🇺",
  "🇨🇻",
  "🇨🇼",
  "🇨🇽",
  "🇨🇾",
  "🇨🇿",
  "🇨",
  "🇩🇪",
  "🇩🇬",
  "🇩🇯",
  "🇩🇰",
  "🇩🇲",
  "🇩🇴",
  "🇩🇿",
  "🇩",
  "🇪🇦",
  "🇪🇨",
  "🇪🇪",
  "🇪🇬",
  "🇪🇭",
  "🇪🇷",
  "🇪🇸",
  "🇪🇹",
  "🇪🇺",
  "🇪",
  "🇫🇮",
  "🇫🇯",
  "🇫🇰",
  "🇫🇲",
  "🇫🇴",
  "🇫🇷",
  "🇫",
  "🇬🇦",
  "🇬🇧",
  "🇬🇩",
  "🇬🇪",
  "🇬🇫",
  "🇬🇬",
  "🇬🇭",
  "🇬🇮",
  "🇬🇱",
  "🇬🇲",
  "🇬🇳",
  "🇬🇵",
  "🇬🇶",
  "🇬🇷",
  "🇬🇸",
  "🇬🇹",
  "🇬🇺",
  "🇬🇼",
  "🇬🇾",
  "🇬",
  "🇭🇰",
  "🇭🇲",
  "🇭🇳",
  "🇭🇷",
  "🇭🇹",
  "🇭🇺",
  "🇭",
  "🇮🇨",
  "🇮🇩",
  "🇮🇪",
  "🇮🇱",
  "🇮🇲",
  "🇮🇳",
  "🇮🇴",
  "🇮🇶",
  "🇮🇷",
  "🇮🇸",
  "🇮🇹",
  "🇮",
  "🇯🇪",
  "🇯🇲",
  "🇯🇴",
  "🇯🇵",
  "🇯",
  "🇰🇪",
  "🇰🇬",
  "🇰🇭",
  "🇰🇮",
  "🇰🇲",
  "🇰🇳",
  "🇰🇵",
  "🇰🇷",
  "🇰🇼",
  "🇰🇾",
  "🇰🇿",
  "🇰",
  "🇱🇦",
  "🇱🇧",
  "🇱🇨",
  "🇱🇮",
  "🇱🇰",
  "🇱🇷",
  "🇱🇸",
  "🇱🇹",
  "🇱🇺",
  "🇱🇻",
  "🇱🇾",
  "🇱",
  "🇲🇦",
  "🇲🇨",
  "🇲🇩",
  "🇲🇪",
  "🇲🇫",
  "🇲🇬",
  "🇲🇭",
  "🇲🇰",
  "🇲🇱",
  "🇲🇲",
  "🇲🇳",
  "🇲🇴",
  "🇲🇵",
  "🇲🇶",
  "🇲🇷",
  "🇲🇸",
  "🇲🇹",
  "🇲🇺",
  "🇲🇻",
  "🇲🇼",
  "🇲🇽",
  "🇲🇾",
  "🇲🇿",
  "🇲",
  "🇳🇦",
  "🇳🇨",
  "🇳🇪",
  "🇳🇫",
  "🇳🇬",
  "🇳🇮",
  "🇳🇱",
  "🇳🇴",
  "🇳🇵",
  "🇳🇷",
  "🇳🇺",
  "🇳🇿",
  "🇳",
  "🇴🇲",
  "🇴",
  "🇵🇦",
  "🇵🇪",
  "🇵🇫",
  "🇵🇬",
  "🇵🇭",
  "🇵🇰",
  "🇵🇱",
  "🇵🇲",
  "🇵🇳",
  "🇵🇷",
  "🇵🇸",
  "🇵🇹",
  "🇵🇼",
  "🇵🇾",
  "🇵",
  "🇶🇦",
  "🇶",
  "🇷🇪",
  "🇷🇴",
  "🇷🇸",
  "🇷🇺",
  "🇷🇼",
  "🇷",
  "🇸🇦",
  "🇸🇧",
  "🇸🇨",
  "🇸🇩",
  "🇸🇪",
  "🇸🇬",
  "🇸🇭",
  "🇸🇮",
  "🇸🇯",
  "🇸🇰",
  "🇸🇱",
  "🇸🇲",
  "🇸🇳",
  "🇸🇴",
  "🇸🇷",
  "🇸🇸",
  "🇸🇹",
  "🇸🇻",
  "🇸🇽",
  "🇸🇾",
  "🇸🇿",
  "🇸",
  "🇹🇦",
  "🇹🇨",
  "🇹🇩",
  "🇹🇫",
  "🇹🇬",
  "🇹🇭",
  "🇹🇯",
  "🇹🇰",
  "🇹🇱",
  "🇹🇲",
  "🇹🇳",
  "🇹🇴",
  "🇹🇷",
  "🇹🇹",
  "🇹🇻",
  "🇹🇼",
  "🇹🇿",
  "🇹",
  "🇺🇦",
  "🇺🇬",
  "🇺🇲",
  "🇺🇳",
  "🇺🇸",
  "🇺🇾",
  "🇺🇿",
  "🇺",
  "🇻🇦",
  "🇻🇨",
  "🇻🇪",
  "🇻🇬",
  "🇻🇮",
  "🇻🇳",
  "🇻🇺",
  "🇻",
  "🇼🇫",
  "🇼🇸",
  "🇼",
  "🇽🇰",
  "🇽",
  "🇾🇪",
  "🇾🇹",
  "🇾",
  "🇿🇦",
  "🇿🇲",
  "🇿🇼",
  "🇿",
  "🈁",
  "🈂️",
  "🈚️",
  "🈯️",
  "🈲",
  "🈳",
  "🈴",
  "🈵",
  "🈶",
  "🈷️",
  "🈸",
  "🈹",
  "🈺",
  "🉐",
  "🉑",
  "🌀",
  "🌁",
  "🌂",
  "🌃",
  "🌄",
  "🌅",
  "🌆",
  "🌇",
  "🌈",
  "🌉",
  "🌊",
  "🌋",
  "🌌",
  "🌍",
  "🌎",
  "🌏",
  "🌐",
  "🌑",
  "🌒",
  "🌓",
  "🌔",
  "🌕",
  "🌖",
  "🌗",
  "🌘",
  "🌙",
  "🌚",
  "🌛",
  "🌜",
  "🌝",
  "🌞",
  "🌟",
  "🌠",
  "🌡️",
  "🌤️",
  "🌥️",
  "🌦️",
  "🌧️",
  "🌨️",
  "🌩️",
  "🌪️",
  "🌫️",
  "🌬️",
  "🌭",
  "🌮",
  "🌯",
  "🌰",
  "🌱",
  "🌲",
  "🌳",
  "🌴",
  "🌵",
  "🌶️",
  "🌷",
  "🌸",
  "🌹",
  "🌺",
  "🌻",
  "🌼",
  "🌽",
  "🌾",
  "🌿",
  "🍀",
  "🍁",
  "🍂",
  "🍃",
  "🍄",
  "🍅",
  "🍆",
  "🍇",
  "🍈",
  "🍉",
  "🍊",
  "🍋",
  "🍌",
  "🍍",
  "🍎",
  "🍏",
  "🍐",
  "🍑",
  "🍒",
  "🍓",
  "🍔",
  "🍕",
  "🍖",
  "🍗",
  "🍘",
  "🍙",
  "🍚",
  "🍛",
  "🍜",
  "🍝",
  "🍞",
  "🍟",
  "🍠",
  "🍡",
  "🍢",
  "🍣",
  "🍤",
  "🍥",
  "🍦",
  "🍧",
  "🍨",
  "🍩",
  "🍪",
  "🍫",
  "🍬",
  "🍭",
  "🍮",
  "🍯",
  "🍰",
  "🍱",
  "🍲",
  "🍳",
  "🍴",
  "🍵",
  "🍶",
  "🍷",
  "🍸",
  "🍹",
  "🍺",
  "🍻",
  "🍼",
  "🍽️",
  "🍾",
  "🍿",
  "🎀",
  "🎁",
  "🎂",
  "🎃",
  "🎄",
  "🎅🏻",
  "🎅🏼",
  "🎅🏽",
  "🎅🏾",
  "🎅🏿",
  "🎅",
  "🎆",
  "🎇",
  "🎈",
  "🎉",
  "🎊",
  "🎋",
  "🎌",
  "🎍",
  "🎎",
  "🎏",
  "🎐",
  "🎑",
  "🎒",
  "🎓",
  "🎖️",
  "🎗️",
  "🎙️",
  "🎚️",
  "🎛️",
  "🎞️",
  "🎟️",
  "🎠",
  "🎡",
  "🎢",
  "🎣",
  "🎤",
  "🎥",
  "🎦",
  "🎧",
  "🎨",
  "🎩",
  "🎪",
  "🎫",
  "🎬",
  "🎭",
  "🎮",
  "🎯",
  "🎰",
  "🎱",
  "🎲",
  "🎳",
  "🎴",
  "🎵",
  "🎶",
  "🎷",
  "🎸",
  "🎹",
  "🎺",
  "🎻",
  "🎼",
  "🎽",
  "🎾",
  "🎿",
  "🏀",
  "🏁",
  "🏂🏻",
  "🏂🏼",
  "🏂🏽",
  "🏂🏾",
  "🏂🏿",
  "🏂",
  "🏃🏻‍♀️",
  "🏃🏻‍♂️",
  "🏃🏻",
  "🏃🏼‍♀️",
  "🏃🏼‍♂️",
  "🏃🏼",
  "🏃🏽‍♀️",
  "🏃🏽‍♂️",
  "🏃🏽",
  "🏃🏾‍♀️",
  "🏃🏾‍♂️",
  "🏃🏾",
  "🏃🏿‍♀️",
  "🏃🏿‍♂️",
  "🏃🏿",
  "🏃‍♀️",
  "🏃‍♂️",
  "🏃",
  "🏄🏻‍♀️",
  "🏄🏻‍♂️",
  "🏄🏻",
  "🏄🏼‍♀️",
  "🏄🏼‍♂️",
  "🏄🏼",
  "🏄🏽‍♀️",
  "🏄🏽‍♂️",
  "🏄🏽",
  "🏄🏾‍♀️",
  "🏄🏾‍♂️",
  "🏄🏾",
  "🏄🏿‍♀️",
  "🏄🏿‍♂️",
  "🏄🏿",
  "🏄‍♀️",
  "🏄‍♂️",
  "🏄",
  "🏅",
  "🏆",
  "🏇🏻",
  "🏇🏼",
  "🏇🏽",
  "🏇🏾",
  "🏇🏿",
  "🏇",
  "🏈",
  "🏉",
  "🏊🏻‍♀️",
  "🏊🏻‍♂️",
  "🏊🏻",
  "🏊🏼‍♀️",
  "🏊🏼‍♂️",
  "🏊🏼",
  "🏊🏽‍♀️",
  "🏊🏽‍♂️",
  "🏊🏽",
  "🏊🏾‍♀️",
  "🏊🏾‍♂️",
  "🏊🏾",
  "🏊🏿‍♀️",
  "🏊🏿‍♂️",
  "🏊🏿",
  "🏊‍♀️",
  "🏊‍♂️",
  "🏊",
  "🏋🏻‍♀️",
  "🏋🏻‍♂️",
  "🏋🏻",
  "🏋🏼‍♀️",
  "🏋🏼‍♂️",
  "🏋🏼",
  "🏋🏽‍♀️",
  "🏋🏽‍♂️",
  "🏋🏽",
  "🏋🏾‍♀️",
  "🏋🏾‍♂️",
  "🏋🏾",
  "🏋🏿‍♀️",
  "🏋🏿‍♂️",
  "🏋🏿",
  "🏋️‍♀️",
  "🏋️‍♂️",
  "🏋️",
  "🏌🏻‍♀️",
  "🏌🏻‍♂️",
  "🏌🏻",
  "🏌🏼‍♀️",
  "🏌🏼‍♂️",
  "🏌🏼",
  "🏌🏽‍♀️",
  "🏌🏽‍♂️",
  "🏌🏽",
  "🏌🏾‍♀️",
  "🏌🏾‍♂️",
  "🏌🏾",
  "🏌🏿‍♀️",
  "🏌🏿‍♂️",
  "🏌🏿",
  "🏌️‍♀️",
  "🏌️‍♂️",
  "🏌️",
  "🏍️",
  "🏎️",
  "🏏",
  "🏐",
  "🏑",
  "🏒",
  "🏓",
  "🏔️",
  "🏕️",
  "🏖️",
  "🏗️",
  "🏘️",
  "🏙️",
  "🏚️",
  "🏛️",
  "🏜️",
  "🏝️",
  "🏞️",
  "🏟️",
  "🏠",
  "🏡",
  "🏢",
  "🏣",
  "🏤",
  "🏥",
  "🏦",
  "🏧",
  "🏨",
  "🏩",
  "🏪",
  "🏫",
  "🏬",
  "🏭",
  "🏮",
  "🏯",
  "🏰",
  "🏳️‍🌈",
  "🏳️",
  "🏴‍☠️",
  "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  "🏴",
  "🏵️",
  "🏷️",
  "🏸",
  "🏹",
  "🏺",
  "🏻",
  "🏼",
  "🏽",
  "🏾",
  "🏿",
  "🐀",
  "🐁",
  "🐂",
  "🐃",
  "🐄",
  "🐅",
  "🐆",
  "🐇",
  "🐈",
  "🐉",
  "🐊",
  "🐋",
  "🐌",
  "🐍",
  "🐎",
  "🐏",
  "🐐",
  "🐑",
  "🐒",
  "🐓",
  "🐔",
  "🐕‍🦺",
  "🐕",
  "🐖",
  "🐗",
  "🐘",
  "🐙",
  "🐚",
  "🐛",
  "🐜",
  "🐝",
  "🐞",
  "🐟",
  "🐠",
  "🐡",
  "🐢",
  "🐣",
  "🐤",
  "🐥",
  "🐦",
  "🐧",
  "🐨",
  "🐩",
  "🐪",
  "🐫",
  "🐬",
  "🐭",
  "🐮",
  "🐯",
  "🐰",
  "🐱",
  "🐲",
  "🐳",
  "🐴",
  "🐵",
  "🐶",
  "🐷",
  "🐸",
  "🐹",
  "🐺",
  "🐻",
  "🐼",
  "🐽",
  "🐾",
  "🐿️",
  "👀",
  "👁‍🗨",
  "👁️",
  "👂🏻",
  "👂🏼",
  "👂🏽",
  "👂🏾",
  "👂🏿",
  "👂",
  "👃🏻",
  "👃🏼",
  "👃🏽",
  "👃🏾",
  "👃🏿",
  "👃",
  "👄",
  "👅",
  "👆🏻",
  "👆🏼",
  "👆🏽",
  "👆🏾",
  "👆🏿",
  "👆",
  "👇🏻",
  "👇🏼",
  "👇🏽",
  "👇🏾",
  "👇🏿",
  "👇",
  "👈🏻",
  "👈🏼",
  "👈🏽",
  "👈🏾",
  "👈🏿",
  "👈",
  "👉🏻",
  "👉🏼",
  "👉🏽",
  "👉🏾",
  "👉🏿",
  "👉",
  "👊🏻",
  "👊🏼",
  "👊🏽",
  "👊🏾",
  "👊🏿",
  "👊",
  "👋🏻",
  "👋🏼",
  "👋🏽",
  "👋🏾",
  "👋🏿",
  "👋",
  "👌🏻",
  "👌🏼",
  "👌🏽",
  "👌🏾",
  "👌🏿",
  "👌",
  "👍🏻",
  "👍🏼",
  "👍🏽",
  "👍🏾",
  "👍🏿",
  "👍",
  "👎🏻",
  "👎🏼",
  "👎🏽",
  "👎🏾",
  "👎🏿",
  "👎",
  "👏🏻",
  "👏🏼",
  "👏🏽",
  "👏🏾",
  "👏🏿",
  "👏",
  "👐🏻",
  "👐🏼",
  "👐🏽",
  "👐🏾",
  "👐🏿",
  "👐",
  "👑",
  "👒",
  "👓",
  "👔",
  "👕",
  "👖",
  "👗",
  "👘",
  "👙",
  "👚",
  "👛",
  "👜",
  "👝",
  "👞",
  "👟",
  "👠",
  "👡",
  "👢",
  "👣",
  "👤",
  "👥",
  "👦🏻",
  "👦🏼",
  "👦🏽",
  "👦🏾",
  "👦🏿",
  "👦",
  "👧🏻",
  "👧🏼",
  "👧🏽",
  "👧🏾",
  "👧🏿",
  "👧",
  "👨🏻‍🌾",
  "👨🏻‍🍳",
  "👨🏻‍🎓",
  "👨🏻‍🎤",
  "👨🏻‍🎨",
  "👨🏻‍🏫",
  "👨🏻‍🏭",
  "👨🏻‍💻",
  "👨🏻‍💼",
  "👨🏻‍🔧",
  "👨🏻‍🔬",
  "👨🏻‍🚀",
  "👨🏻‍🚒",
  "👨🏻‍🦯",
  "👨🏻‍🦰",
  "👨🏻‍🦱",
  "👨🏻‍🦲",
  "👨🏻‍🦳",
  "👨🏻‍🦼",
  "👨🏻‍🦽",
  "👨🏻‍⚕️",
  "👨🏻‍⚖️",
  "👨🏻‍✈️",
  "👨🏻",
  "👨🏼‍🌾",
  "👨🏼‍🍳",
  "👨🏼‍🎓",
  "👨🏼‍🎤",
  "👨🏼‍🎨",
  "👨🏼‍🏫",
  "👨🏼‍🏭",
  "👨🏼‍💻",
  "👨🏼‍💼",
  "👨🏼‍🔧",
  "👨🏼‍🔬",
  "👨🏼‍🚀",
  "👨🏼‍🚒",
  "👨🏼‍🤝‍👨🏻",
  "👨🏼‍🦯",
  "👨🏼‍🦰",
  "👨🏼‍🦱",
  "👨🏼‍🦲",
  "👨🏼‍🦳",
  "👨🏼‍🦼",
  "👨🏼‍🦽",
  "👨🏼‍⚕️",
  "👨🏼‍⚖️",
  "👨🏼‍✈️",
  "👨🏼",
  "👨🏽‍🌾",
  "👨🏽‍🍳",
  "👨🏽‍🎓",
  "👨🏽‍🎤",
  "👨🏽‍🎨",
  "👨🏽‍🏫",
  "👨🏽‍🏭",
  "👨🏽‍💻",
  "👨🏽‍💼",
  "👨🏽‍🔧",
  "👨🏽‍🔬",
  "👨🏽‍🚀",
  "👨🏽‍🚒",
  "👨🏽‍🤝‍👨🏻",
  "👨🏽‍🤝‍👨🏼",
  "👨🏽‍🦯",
  "👨🏽‍🦰",
  "👨🏽‍🦱",
  "👨🏽‍🦲",
  "👨🏽‍🦳",
  "👨🏽‍🦼",
  "👨🏽‍🦽",
  "👨🏽‍⚕️",
  "👨🏽‍⚖️",
  "👨🏽‍✈️",
  "👨🏽",
  "👨🏾‍🌾",
  "👨🏾‍🍳",
  "👨🏾‍🎓",
  "👨🏾‍🎤",
  "👨🏾‍🎨",
  "👨🏾‍🏫",
  "👨🏾‍🏭",
  "👨🏾‍💻",
  "👨🏾‍💼",
  "👨🏾‍🔧",
  "👨🏾‍🔬",
  "👨🏾‍🚀",
  "👨🏾‍🚒",
  "👨🏾‍🤝‍👨🏻",
  "👨🏾‍🤝‍👨🏼",
  "👨🏾‍🤝‍👨🏽",
  "👨🏾‍🦯",
  "👨🏾‍🦰",
  "👨🏾‍🦱",
  "👨🏾‍🦲",
  "👨🏾‍🦳",
  "👨🏾‍🦼",
  "👨🏾‍🦽",
  "👨🏾‍⚕️",
  "👨🏾‍⚖️",
  "👨🏾‍✈️",
  "👨🏾",
  "👨🏿‍🌾",
  "👨🏿‍🍳",
  "👨🏿‍🎓",
  "👨🏿‍🎤",
  "👨🏿‍🎨",
  "👨🏿‍🏫",
  "👨🏿‍🏭",
  "👨🏿‍💻",
  "👨🏿‍💼",
  "👨🏿‍🔧",
  "👨🏿‍🔬",
  "👨🏿‍🚀",
  "👨🏿‍🚒",
  "👨🏿‍🤝‍👨🏻",
  "👨🏿‍🤝‍👨🏼",
  "👨🏿‍🤝‍👨🏽",
  "👨🏿‍🤝‍👨🏾",
  "👨🏿‍🦯",
  "👨🏿‍🦰",
  "👨🏿‍🦱",
  "👨🏿‍🦲",
  "👨🏿‍🦳",
  "👨🏿‍🦼",
  "👨🏿‍🦽",
  "👨🏿‍⚕️",
  "👨🏿‍⚖️",
  "👨🏿‍✈️",
  "👨🏿",
  "👨‍🌾",
  "👨‍🍳",
  "👨‍🎓",
  "👨‍🎤",
  "👨‍🎨",
  "👨‍🏫",
  "👨‍🏭",
  "👨‍👦‍👦",
  "👨‍👦",
  "👨‍👧‍👦",
  "👨‍👧‍👧",
  "👨‍👧",
  "👨‍👨‍👦‍👦",
  "👨‍👨‍👦",
  "👨‍👨‍👧‍👦",
  "👨‍👨‍👧‍👧",
  "👨‍👨‍👧",
  "👨‍👩‍👦‍👦",
  "👨‍👩‍👦",
  "👨‍👩‍👧‍👦",
  "👨‍👩‍👧‍👧",
  "👨‍👩‍👧",
  "👨‍💻",
  "👨‍💼",
  "👨‍🔧",
  "👨‍🔬",
  "👨‍🚀",
  "👨‍🚒",
  "👨‍🦯",
  "👨‍🦰",
  "👨‍🦱",
  "👨‍🦲",
  "👨‍🦳",
  "👨‍🦼",
  "👨‍🦽",
  "👨‍⚕️",
  "👨‍⚖️",
  "👨‍✈️",
  "👨‍❤️‍👨",
  "👨‍❤️‍💋‍👨",
  "👨",
  "👩🏻‍🌾",
  "👩🏻‍🍳",
  "👩🏻‍🎓",
  "👩🏻‍🎤",
  "👩🏻‍🎨",
  "👩🏻‍🏫",
  "👩🏻‍🏭",
  "👩🏻‍💻",
  "👩🏻‍💼",
  "👩🏻‍🔧",
  "👩🏻‍🔬",
  "👩🏻‍🚀",
  "👩🏻‍🚒",
  "👩🏻‍🤝‍👨🏼",
  "👩🏻‍🤝‍👨🏽",
  "👩🏻‍🤝‍👨🏾",
  "👩🏻‍🤝‍👨🏿",
  "👩🏻‍🦯",
  "👩🏻‍🦰",
  "👩🏻‍🦱",
  "👩🏻‍🦲",
  "👩🏻‍🦳",
  "👩🏻‍🦼",
  "👩🏻‍🦽",
  "👩🏻‍⚕️",
  "👩🏻‍⚖️",
  "👩🏻‍✈️",
  "👩🏻",
  "👩🏼‍🌾",
  "👩🏼‍🍳",
  "👩🏼‍🎓",
  "👩🏼‍🎤",
  "👩🏼‍🎨",
  "👩🏼‍🏫",
  "👩🏼‍🏭",
  "👩🏼‍💻",
  "👩🏼‍💼",
  "👩🏼‍🔧",
  "👩🏼‍🔬",
  "👩🏼‍🚀",
  "👩🏼‍🚒",
  "👩🏼‍🤝‍👨🏻",
  "👩🏼‍🤝‍👨🏽",
  "👩🏼‍🤝‍👨🏾",
  "👩🏼‍🤝‍👨🏿",
  "👩🏼‍🤝‍👩🏻",
  "👩🏼‍🦯",
  "👩🏼‍🦰",
  "👩🏼‍🦱",
  "👩🏼‍🦲",
  "👩🏼‍🦳",
  "👩🏼‍🦼",
  "👩🏼‍🦽",
  "👩🏼‍⚕️",
  "👩🏼‍⚖️",
  "👩🏼‍✈️",
  "👩🏼",
  "👩🏽‍🌾",
  "👩🏽‍🍳",
  "👩🏽‍🎓",
  "👩🏽‍🎤",
  "👩🏽‍🎨",
  "👩🏽‍🏫",
  "👩🏽‍🏭",
  "👩🏽‍💻",
  "👩🏽‍💼",
  "👩🏽‍🔧",
  "👩🏽‍🔬",
  "👩🏽‍🚀",
  "👩🏽‍🚒",
  "👩🏽‍🤝‍👨🏻",
  "👩🏽‍🤝‍👨🏼",
  "👩🏽‍🤝‍👨🏾",
  "👩🏽‍🤝‍👨🏿",
  "👩🏽‍🤝‍👩🏻",
  "👩🏽‍🤝‍👩🏼",
  "👩🏽‍🦯",
  "👩🏽‍🦰",
  "👩🏽‍🦱",
  "👩🏽‍🦲",
  "👩🏽‍🦳",
  "👩🏽‍🦼",
  "👩🏽‍🦽",
  "👩🏽‍⚕️",
  "👩🏽‍⚖️",
  "👩🏽‍✈️",
  "👩🏽",
  "👩🏾‍🌾",
  "👩🏾‍🍳",
  "👩🏾‍🎓",
  "👩🏾‍🎤",
  "👩🏾‍🎨",
  "👩🏾‍🏫",
  "👩🏾‍🏭",
  "👩🏾‍💻",
  "👩🏾‍💼",
  "👩🏾‍🔧",
  "👩🏾‍🔬",
  "👩🏾‍🚀",
  "👩🏾‍🚒",
  "👩🏾‍🤝‍👨🏻",
  "👩🏾‍🤝‍👨🏼",
  "👩🏾‍🤝‍👨🏽",
  "👩🏾‍🤝‍👨🏿",
  "👩🏾‍🤝‍👩🏻",
  "👩🏾‍🤝‍👩🏼",
  "👩🏾‍🤝‍👩🏽",
  "👩🏾‍🦯",
  "👩🏾‍🦰",
  "👩🏾‍🦱",
  "👩🏾‍🦲",
  "👩🏾‍🦳",
  "👩🏾‍🦼",
  "👩🏾‍🦽",
  "👩🏾‍⚕️",
  "👩🏾‍⚖️",
  "👩🏾‍✈️",
  "👩🏾",
  "👩🏿‍🌾",
  "👩🏿‍🍳",
  "👩🏿‍🎓",
  "👩🏿‍🎤",
  "👩🏿‍🎨",
  "👩🏿‍🏫",
  "👩🏿‍🏭",
  "👩🏿‍💻",
  "👩🏿‍💼",
  "👩🏿‍🔧",
  "👩🏿‍🔬",
  "👩🏿‍🚀",
  "👩🏿‍🚒",
  "👩🏿‍🤝‍👨🏻",
  "👩🏿‍🤝‍👨🏼",
  "👩🏿‍🤝‍👨🏽",
  "👩🏿‍🤝‍👨🏾",
  "👩🏿‍🤝‍👩🏻",
  "👩🏿‍🤝‍👩🏼",
  "👩🏿‍🤝‍👩🏽",
  "👩🏿‍🤝‍👩🏾",
  "👩🏿‍🦯",
  "👩🏿‍🦰",
  "👩🏿‍🦱",
  "👩🏿‍🦲",
  "👩🏿‍🦳",
  "👩🏿‍🦼",
  "👩🏿‍🦽",
  "👩🏿‍⚕️",
  "👩🏿‍⚖️",
  "👩🏿‍✈️",
  "👩🏿",
  "👩‍🌾",
  "👩‍🍳",
  "👩‍🎓",
  "👩‍🎤",
  "👩‍🎨",
  "👩‍🏫",
  "👩‍🏭",
  "👩‍👦‍👦",
  "👩‍👦",
  "👩‍👧‍👦",
  "👩‍👧‍👧",
  "👩‍👧",
  "👩‍👩‍👦‍👦",
  "👩‍👩‍👦",
  "👩‍👩‍👧‍👦",
  "👩‍👩‍👧‍👧",
  "👩‍👩‍👧",
  "👩‍💻",
  "👩‍💼",
  "👩‍🔧",
  "👩‍🔬",
  "👩‍🚀",
  "👩‍🚒",
  "👩‍🦯",
  "👩‍🦰",
  "👩‍🦱",
  "👩‍🦲",
  "👩‍🦳",
  "👩‍🦼",
  "👩‍🦽",
  "👩‍⚕️",
  "👩‍⚖️",
  "👩‍✈️",
  "👩‍❤️‍👨",
  "👩‍❤️‍👩",
  "👩‍❤️‍💋‍👨",
  "👩‍❤️‍💋‍👩",
  "👩",
  "👪",
  "👫🏻",
  "👫🏼",
  "👫🏽",
  "👫🏾",
  "👫🏿",
  "👫",
  "👬🏻",
  "👬🏼",
  "👬🏽",
  "👬🏾",
  "👬🏿",
  "👬",
  "👭🏻",
  "👭🏼",
  "👭🏽",
  "👭🏾",
  "👭🏿",
  "👭",
  "👮🏻‍♀️",
  "👮🏻‍♂️",
  "👮🏻",
  "👮🏼‍♀️",
  "👮🏼‍♂️",
  "👮🏼",
  "👮🏽‍♀️",
  "👮🏽‍♂️",
  "👮🏽",
  "👮🏾‍♀️",
  "👮🏾‍♂️",
  "👮🏾",
  "👮🏿‍♀️",
  "👮🏿‍♂️",
  "👮🏿",
  "👮‍♀️",
  "👮‍♂️",
  "👮",
  "👯‍♀️",
  "👯‍♂️",
  "👯",
  "👰🏻",
  "👰🏼",
  "👰🏽",
  "👰🏾",
  "👰🏿",
  "👰",
  "👱🏻‍♀️",
  "👱🏻‍♂️",
  "👱🏻",
  "👱🏼‍♀️",
  "👱🏼‍♂️",
  "👱🏼",
  "👱🏽‍♀️",
  "👱🏽‍♂️",
  "👱🏽",
  "👱🏾‍♀️",
  "👱🏾‍♂️",
  "👱🏾",
  "👱🏿‍♀️",
  "👱🏿‍♂️",
  "👱🏿",
  "👱‍♀️",
  "👱‍♂️",
  "👱",
  "👲🏻",
  "👲🏼",
  "👲🏽",
  "👲🏾",
  "👲🏿",
  "👲",
  "👳🏻‍♀️",
  "👳🏻‍♂️",
  "👳🏻",
  "👳🏼‍♀️",
  "👳🏼‍♂️",
  "👳🏼",
  "👳🏽‍♀️",
  "👳🏽‍♂️",
  "👳🏽",
  "👳🏾‍♀️",
  "👳🏾‍♂️",
  "👳🏾",
  "👳🏿‍♀️",
  "👳🏿‍♂️",
  "👳🏿",
  "👳‍♀️",
  "👳‍♂️",
  "👳",
  "👴🏻",
  "👴🏼",
  "👴🏽",
  "👴🏾",
  "👴🏿",
  "👴",
  "👵🏻",
  "👵🏼",
  "👵🏽",
  "👵🏾",
  "👵🏿",
  "👵",
  "👶🏻",
  "👶🏼",
  "👶🏽",
  "👶🏾",
  "👶🏿",
  "👶",
  "👷🏻‍♀️",
  "👷🏻‍♂️",
  "👷🏻",
  "👷🏼‍♀️",
  "👷🏼‍♂️",
  "👷🏼",
  "👷🏽‍♀️",
  "👷🏽‍♂️",
  "👷🏽",
  "👷🏾‍♀️",
  "👷🏾‍♂️",
  "👷🏾",
  "👷🏿‍♀️",
  "👷🏿‍♂️",
  "👷🏿",
  "👷‍♀️",
  "👷‍♂️",
  "👷",
  "👸🏻",
  "👸🏼",
  "👸🏽",
  "👸🏾",
  "👸🏿",
  "👸",
  "👹",
  "👺",
  "👻",
  "👼🏻",
  "👼🏼",
  "👼🏽",
  "👼🏾",
  "👼🏿",
  "👼",
  "👽",
  "👾",
  "👿",
  "💀",
  "💁🏻‍♀️",
  "💁🏻‍♂️",
  "💁🏻",
  "💁🏼‍♀️",
  "💁🏼‍♂️",
  "💁🏼",
  "💁🏽‍♀️",
  "💁🏽‍♂️",
  "💁🏽",
  "💁🏾‍♀️",
  "💁🏾‍♂️",
  "💁🏾",
  "💁🏿‍♀️",
  "💁🏿‍♂️",
  "💁🏿",
  "💁‍♀️",
  "💁‍♂️",
  "💁",
  "💂🏻‍♀️",
  "💂🏻‍♂️",
  "💂🏻",
  "💂🏼‍♀️",
  "💂🏼‍♂️",
  "💂🏼",
  "💂🏽‍♀️",
  "💂🏽‍♂️",
  "💂🏽",
  "💂🏾‍♀️",
  "💂🏾‍♂️",
  "💂🏾",
  "💂🏿‍♀️",
  "💂🏿‍♂️",
  "💂🏿",
  "💂‍♀️",
  "💂‍♂️",
  "💂",
  "💃🏻",
  "💃🏼",
  "💃🏽",
  "💃🏾",
  "💃🏿",
  "💃",
  "💄",
  "💅🏻",
  "💅🏼",
  "💅🏽",
  "💅🏾",
  "💅🏿",
  "💅",
  "💆🏻‍♀️",
  "💆🏻‍♂️",
  "💆🏻",
  "💆🏼‍♀️",
  "💆🏼‍♂️",
  "💆🏼",
  "💆🏽‍♀️",
  "💆🏽‍♂️",
  "💆🏽",
  "💆🏾‍♀️",
  "💆🏾‍♂️",
  "💆🏾",
  "💆🏿‍♀️",
  "💆🏿‍♂️",
  "💆🏿",
  "💆‍♀️",
  "💆‍♂️",
  "💆",
  "💇🏻‍♀️",
  "💇🏻‍♂️",
  "💇🏻",
  "💇🏼‍♀️",
  "💇🏼‍♂️",
  "💇🏼",
  "💇🏽‍♀️",
  "💇🏽‍♂️",
  "💇🏽",
  "💇🏾‍♀️",
  "💇🏾‍♂️",
  "💇🏾",
  "💇🏿‍♀️",
  "💇🏿‍♂️",
  "💇🏿",
  "💇‍♀️",
  "💇‍♂️",
  "💇",
  "💈",
  "💉",
  "💊",
  "💋",
  "💌",
  "💍",
  "💎",
  "💏",
  "💐",
  "💑",
  "💒",
  "💓",
  "💔",
  "💕",
  "💖",
  "💗",
  "💘",
  "💙",
  "💚",
  "💛",
  "💜",
  "💝",
  "💞",
  "💟",
  "💠",
  "💡",
  "💢",
  "💣",
  "💤",
  "💥",
  "💦",
  "💧",
  "💨",
  "💩",
  "💪🏻",
  "💪🏼",
  "💪🏽",
  "💪🏾",
  "💪🏿",
  "💪",
  "💫",
  "💬",
  "💭",
  "💮",
  "💯",
  "💰",
  "💱",
  "💲",
  "💳",
  "💴",
  "💵",
  "💶",
  "💷",
  "💸",
  "💹",
  "💺",
  "💻",
  "💼",
  "💽",
  "💾",
  "💿",
  "📀",
  "📁",
  "📂",
  "📃",
  "📄",
  "📅",
  "📆",
  "📇",
  "📈",
  "📉",
  "📊",
  "📋",
  "📌",
  "📍",
  "📎",
  "📏",
  "📐",
  "📑",
  "📒",
  "📓",
  "📔",
  "📕",
  "📖",
  "📗",
  "📘",
  "📙",
  "📚",
  "📛",
  "📜",
  "📝",
  "📞",
  "📟",
  "📠",
  "📡",
  "📢",
  "📣",
  "📤",
  "📥",
  "📦",
  "📧",
  "📨",
  "📩",
  "📪",
  "📫",
  "📬",
  "📭",
  "📮",
  "📯",
  "📰",
  "📱",
  "📲",
  "📳",
  "📴",
  "📵",
  "📶",
  "📷",
  "📸",
  "📹",
  "📺",
  "📻",
  "📼",
  "📽️",
  "📿",
  "🔀",
  "🔁",
  "🔂",
  "🔃",
  "🔄",
  "🔅",
  "🔆",
  "🔇",
  "🔈",
  "🔉",
  "🔊",
  "🔋",
  "🔌",
  "🔍",
  "🔎",
  "🔏",
  "🔐",
  "🔑",
  "🔒",
  "🔓",
  "🔔",
  "🔕",
  "🔖",
  "🔗",
  "🔘",
  "🔙",
  "🔚",
  "🔛",
  "🔜",
  "🔝",
  "🔞",
  "🔟",
  "🔠",
  "🔡",
  "🔢",
  "🔣",
  "🔤",
  "🔥",
  "🔦",
  "🔧",
  "🔨",
  "🔩",
  "🔪",
  "🔫",
  "🔬",
  "🔭",
  "🔮",
  "🔯",
  "🔰",
  "🔱",
  "🔲",
  "🔳",
  "🔴",
  "🔵",
  "🔶",
  "🔷",
  "🔸",
  "🔹",
  "🔺",
  "🔻",
  "🔼",
  "🔽",
  "🕉️",
  "🕊️",
  "🕋",
  "🕌",
  "🕍",
  "🕎",
  "🕐",
  "🕑",
  "🕒",
  "🕓",
  "🕔",
  "🕕",
  "🕖",
  "🕗",
  "🕘",
  "🕙",
  "🕚",
  "🕛",
  "🕜",
  "🕝",
  "🕞",
  "🕟",
  "🕠",
  "🕡",
  "🕢",
  "🕣",
  "🕤",
  "🕥",
  "🕦",
  "🕧",
  "🕯️",
  "🕰️",
  "🕳️",
  "🕴🏻‍♀️",
  "🕴🏻‍♂️",
  "🕴🏻",
  "🕴🏼‍♀️",
  "🕴🏼‍♂️",
  "🕴🏼",
  "🕴🏽‍♀️",
  "🕴🏽‍♂️",
  "🕴🏽",
  "🕴🏾‍♀️",
  "🕴🏾‍♂️",
  "🕴🏾",
  "🕴🏿‍♀️",
  "🕴🏿‍♂️",
  "🕴🏿",
  "🕴️‍♀️",
  "🕴️‍♂️",
  "🕴️",
  "🕵🏻‍♀️",
  "🕵🏻‍♂️",
  "🕵🏻",
  "🕵🏼‍♀️",
  "🕵🏼‍♂️",
  "🕵🏼",
  "🕵🏽‍♀️",
  "🕵🏽‍♂️",
  "🕵🏽",
  "🕵🏾‍♀️",
  "🕵🏾‍♂️",
  "🕵🏾",
  "🕵🏿‍♀️",
  "🕵🏿‍♂️",
  "🕵🏿",
  "🕵️‍♀️",
  "🕵️‍♂️",
  "🕵️",
  "🕶️",
  "🕷️",
  "🕸️",
  "🕹️",
  "🕺🏻",
  "🕺🏼",
  "🕺🏽",
  "🕺🏾",
  "🕺🏿",
  "🕺",
  "🖇️",
  "🖊️",
  "🖋️",
  "🖌️",
  "🖍️",
  "🖐🏻",
  "🖐🏼",
  "🖐🏽",
  "🖐🏾",
  "🖐🏿",
  "🖐️",
  "🖕🏻",
  "🖕🏼",
  "🖕🏽",
  "🖕🏾",
  "🖕🏿",
  "🖕",
  "🖖🏻",
  "🖖🏼",
  "🖖🏽",
  "🖖🏾",
  "🖖🏿",
  "🖖",
  "🖤",
  "🖥️",
  "🖨️",
  "🖱️",
  "🖲️",
  "🖼️",
  "🗂️",
  "🗃️",
  "🗄️",
  "🗑️",
  "🗒️",
  "🗓️",
  "🗜️",
  "🗝️",
  "🗞️",
  "🗡️",
  "🗣️",
  "🗨️",
  "🗯️",
  "🗳️",
  "🗺️",
  "🗻",
  "🗼",
  "🗽",
  "🗾",
  "🗿",
  "😀",
  "😁",
  "😂",
  "😃",
  "😄",
  "😅",
  "😆",
  "😇",
  "😈",
  "😉",
  "😊",
  "😋",
  "😌",
  "😍",
  "😎",
  "😏",
  "😐",
  "😑",
  "😒",
  "😓",
  "😔",
  "😕",
  "😖",
  "😗",
  "😘",
  "😙",
  "😚",
  "😛",
  "😜",
  "😝",
  "😞",
  "😟",
  "😠",
  "😡",
  "😢",
  "😣",
  "😤",
  "😥",
  "😦",
  "😧",
  "😨",
  "😩",
  "😪",
  "😫",
  "😬",
  "😭",
  "😮",
  "😯",
  "😰",
  "😱",
  "😲",
  "😳",
  "😴",
  "😵",
  "😶",
  "😷",
  "😸",
  "😹",
  "😺",
  "😻",
  "😼",
  "😽",
  "😾",
  "😿",
  "🙀",
  "🙁",
  "🙂",
  "🙃",
  "🙄",
  "🙅🏻‍♀️",
  "🙅🏻‍♂️",
  "🙅🏻",
  "🙅🏼‍♀️",
  "🙅🏼‍♂️",
  "🙅🏼",
  "🙅🏽‍♀️",
  "🙅🏽‍♂️",
  "🙅🏽",
  "🙅🏾‍♀️",
  "🙅🏾‍♂️",
  "🙅🏾",
  "🙅🏿‍♀️",
  "🙅🏿‍♂️",
  "🙅🏿",
  "🙅‍♀️",
  "🙅‍♂️",
  "🙅",
  "🙆🏻‍♀️",
  "🙆🏻‍♂️",
  "🙆🏻",
  "🙆🏼‍♀️",
  "🙆🏼‍♂️",
  "🙆🏼",
  "🙆🏽‍♀️",
  "🙆🏽‍♂️",
  "🙆🏽",
  "🙆🏾‍♀️",
  "🙆🏾‍♂️",
  "🙆🏾",
  "🙆🏿‍♀️",
  "🙆🏿‍♂️",
  "🙆🏿",
  "🙆‍♀️",
  "🙆‍♂️",
  "🙆",
  "🙇🏻‍♀️",
  "🙇🏻‍♂️",
  "🙇🏻",
  "🙇🏼‍♀️",
  "🙇🏼‍♂️",
  "🙇🏼",
  "🙇🏽‍♀️",
  "🙇🏽‍♂️",
  "🙇🏽",
  "🙇🏾‍♀️",
  "🙇🏾‍♂️",
  "🙇🏾",
  "🙇🏿‍♀️",
  "🙇🏿‍♂️",
  "🙇🏿",
  "🙇‍♀️",
  "🙇‍♂️",
  "🙇",
  "🙈",
  "🙉",
  "🙊",
  "🙋🏻‍♀️",
  "🙋🏻‍♂️",
  "🙋🏻",
  "🙋🏼‍♀️",
  "🙋🏼‍♂️",
  "🙋🏼",
  "🙋🏽‍♀️",
  "🙋🏽‍♂️",
  "🙋🏽",
  "🙋🏾‍♀️",
  "🙋🏾‍♂️",
  "🙋🏾",
  "🙋🏿‍♀️",
  "🙋🏿‍♂️",
  "🙋🏿",
  "🙋‍♀️",
  "🙋‍♂️",
  "🙋",
  "🙌🏻",
  "🙌🏼",
  "🙌🏽",
  "🙌🏾",
  "🙌🏿",
  "🙌",
  "🙍🏻‍♀️",
  "🙍🏻‍♂️",
  "🙍🏻",
  "🙍🏼‍♀️",
  "🙍🏼‍♂️",
  "🙍🏼",
  "🙍🏽‍♀️",
  "🙍🏽‍♂️",
  "🙍🏽",
  "🙍🏾‍♀️",
  "🙍🏾‍♂️",
  "🙍🏾",
  "🙍🏿‍♀️",
  "🙍🏿‍♂️",
  "🙍🏿",
  "🙍‍♀️",
  "🙍‍♂️",
  "🙍",
  "🙎🏻‍♀️",
  "🙎🏻‍♂️",
  "🙎🏻",
  "🙎🏼‍♀️",
  "🙎🏼‍♂️",
  "🙎🏼",
  "🙎🏽‍♀️",
  "🙎🏽‍♂️",
  "🙎🏽",
  "🙎🏾‍♀️",
  "🙎🏾‍♂️",
  "🙎🏾",
  "🙎🏿‍♀️",
  "🙎🏿‍♂️",
  "🙎🏿",
  "🙎‍♀️",
  "🙎‍♂️",
  "🙎",
  "🙏🏻",
  "🙏🏼",
  "🙏🏽",
  "🙏🏾",
  "🙏🏿",
  "🙏",
  "🚀",
  "🚁",
  "🚂",
  "🚃",
  "🚄",
  "🚅",
  "🚆",
  "🚇",
  "🚈",
  "🚉",
  "🚊",
  "🚋",
  "🚌",
  "🚍",
  "🚎",
  "🚏",
  "🚐",
  "🚑",
  "🚒",
  "🚓",
  "🚔",
  "🚕",
  "🚖",
  "🚗",
  "🚘",
  "🚙",
  "🚚",
  "🚛",
  "🚜",
  "🚝",
  "🚞",
  "🚟",
  "🚠",
  "🚡",
  "🚢",
  "🚣🏻‍♀️",
  "🚣🏻‍♂️",
  "🚣🏻",
  "🚣🏼‍♀️",
  "🚣🏼‍♂️",
  "🚣🏼",
  "🚣🏽‍♀️",
  "🚣🏽‍♂️",
  "🚣🏽",
  "🚣🏾‍♀️",
  "🚣🏾‍♂️",
  "🚣🏾",
  "🚣🏿‍♀️",
  "🚣🏿‍♂️",
  "🚣🏿",
  "🚣‍♀️",
  "🚣‍♂️",
  "🚣",
  "🚤",
  "🚥",
  "🚦",
  "🚧",
  "🚨",
  "🚩",
  "🚪",
  "🚫",
  "🚬",
  "🚭",
  "🚮",
  "🚯",
  "🚰",
  "🚱",
  "🚲",
  "🚳",
  "🚴🏻‍♀️",
  "🚴🏻‍♂️",
  "🚴🏻",
  "🚴🏼‍♀️",
  "🚴🏼‍♂️",
  "🚴🏼",
  "🚴🏽‍♀️",
  "🚴🏽‍♂️",
  "🚴🏽",
  "🚴🏾‍♀️",
  "🚴🏾‍♂️",
  "🚴🏾",
  "🚴🏿‍♀️",
  "🚴🏿‍♂️",
  "🚴🏿",
  "🚴‍♀️",
  "🚴‍♂️",
  "🚴",
  "🚵🏻‍♀️",
  "🚵🏻‍♂️",
  "🚵🏻",
  "🚵🏼‍♀️",
  "🚵🏼‍♂️",
  "🚵🏼",
  "🚵🏽‍♀️",
  "🚵🏽‍♂️",
  "🚵🏽",
  "🚵🏾‍♀️",
  "🚵🏾‍♂️",
  "🚵🏾",
  "🚵🏿‍♀️",
  "🚵🏿‍♂️",
  "🚵🏿",
  "🚵‍♀️",
  "🚵‍♂️",
  "🚵",
  "🚶🏻‍♀️",
  "🚶🏻‍♂️",
  "🚶🏻",
  "🚶🏼‍♀️",
  "🚶🏼‍♂️",
  "🚶🏼",
  "🚶🏽‍♀️",
  "🚶🏽‍♂️",
  "🚶🏽",
  "🚶🏾‍♀️",
  "🚶🏾‍♂️",
  "🚶🏾",
  "🚶🏿‍♀️",
  "🚶🏿‍♂️",
  "🚶🏿",
  "🚶‍♀️",
  "🚶‍♂️",
  "🚶",
  "🚷",
  "🚸",
  "🚹",
  "🚺",
  "🚻",
  "🚼",
  "🚽",
  "🚾",
  "🚿",
  "🛀🏻",
  "🛀🏼",
  "🛀🏽",
  "🛀🏾",
  "🛀🏿",
  "🛀",
  "🛁",
  "🛂",
  "🛃",
  "🛄",
  "🛅",
  "🛋️",
  "🛌🏻",
  "🛌🏼",
  "🛌🏽",
  "🛌🏾",
  "🛌🏿",
  "🛌",
  "🛍️",
  "🛎️",
  "🛏️",
  "🛐",
  "🛑",
  "🛒",
  "🛕",
  "🛠️",
  "🛡️",
  "🛢️",
  "🛣️",
  "🛤️",
  "🛥️",
  "🛩️",
  "🛫",
  "🛬",
  "🛰️",
  "🛳️",
  "🛴",
  "🛵",
  "🛶",
  "🛷",
  "🛸",
  "🛹",
  "🛺",
  "🟠",
  "🟡",
  "🟢",
  "🟣",
  "🟤",
  "🟥",
  "🟦",
  "🟧",
  "🟨",
  "🟩",
  "🟪",
  "🟫",
  "🤍",
  "🤎",
  "🤏🏻",
  "🤏🏼",
  "🤏🏽",
  "🤏🏾",
  "🤏🏿",
  "🤏",
  "🤐",
  "🤑",
  "🤒",
  "🤓",
  "🤔",
  "🤕",
  "🤖",
  "🤗",
  "🤘🏻",
  "🤘🏼",
  "🤘🏽",
  "🤘🏾",
  "🤘🏿",
  "🤘",
  "🤙🏻",
  "🤙🏼",
  "🤙🏽",
  "🤙🏾",
  "🤙🏿",
  "🤙",
  "🤚🏻",
  "🤚🏼",
  "🤚🏽",
  "🤚🏾",
  "🤚🏿",
  "🤚",
  "🤛🏻",
  "🤛🏼",
  "🤛🏽",
  "🤛🏾",
  "🤛🏿",
  "🤛",
  "🤜🏻",
  "🤜🏼",
  "🤜🏽",
  "🤜🏾",
  "🤜🏿",
  "🤜",
  "🤝",
  "🤞🏻",
  "🤞🏼",
  "🤞🏽",
  "🤞🏾",
  "🤞🏿",
  "🤞",
  "🤟🏻",
  "🤟🏼",
  "🤟🏽",
  "🤟🏾",
  "🤟🏿",
  "🤟",
  "🤠",
  "🤡",
  "🤢",
  "🤣",
  "🤤",
  "🤥",
  "🤦🏻‍♀️",
  "🤦🏻‍♂️",
  "🤦🏻",
  "🤦🏼‍♀️",
  "🤦🏼‍♂️",
  "🤦🏼",
  "🤦🏽‍♀️",
  "🤦🏽‍♂️",
  "🤦🏽",
  "🤦🏾‍♀️",
  "🤦🏾‍♂️",
  "🤦🏾",
  "🤦🏿‍♀️",
  "🤦🏿‍♂️",
  "🤦🏿",
  "🤦‍♀️",
  "🤦‍♂️",
  "🤦",
  "🤧",
  "🤨",
  "🤩",
  "🤪",
  "🤫",
  "🤬",
  "🤭",
  "🤮",
  "🤯",
  "🤰🏻",
  "🤰🏼",
  "🤰🏽",
  "🤰🏾",
  "🤰🏿",
  "🤰",
  "🤱🏻",
  "🤱🏼",
  "🤱🏽",
  "🤱🏾",
  "🤱🏿",
  "🤱",
  "🤲🏻",
  "🤲🏼",
  "🤲🏽",
  "🤲🏾",
  "🤲🏿",
  "🤲",
  "🤳🏻",
  "🤳🏼",
  "🤳🏽",
  "🤳🏾",
  "🤳🏿",
  "🤳",
  "🤴🏻",
  "🤴🏼",
  "🤴🏽",
  "🤴🏾",
  "🤴🏿",
  "🤴",
  "🤵🏻‍♀️",
  "🤵🏻‍♂️",
  "🤵🏻",
  "🤵🏼‍♀️",
  "🤵🏼‍♂️",
  "🤵🏼",
  "🤵🏽‍♀️",
  "🤵🏽‍♂️",
  "🤵🏽",
  "🤵🏾‍♀️",
  "🤵🏾‍♂️",
  "🤵🏾",
  "🤵🏿‍♀️",
  "🤵🏿‍♂️",
  "🤵🏿",
  "🤵‍♀️",
  "🤵‍♂️",
  "🤵",
  "🤶🏻",
  "🤶🏼",
  "🤶🏽",
  "🤶🏾",
  "🤶🏿",
  "🤶",
  "🤷🏻‍♀️",
  "🤷🏻‍♂️",
  "🤷🏻",
  "🤷🏼‍♀️",
  "🤷🏼‍♂️",
  "🤷🏼",
  "🤷🏽‍♀️",
  "🤷🏽‍♂️",
  "🤷🏽",
  "🤷🏾‍♀️",
  "🤷🏾‍♂️",
  "🤷🏾",
  "🤷🏿‍♀️",
  "🤷🏿‍♂️",
  "🤷🏿",
  "🤷‍♀️",
  "🤷‍♂️",
  "🤷",
  "🤸🏻‍♀️",
  "🤸🏻‍♂️",
  "🤸🏻",
  "🤸🏼‍♀️",
  "🤸🏼‍♂️",
  "🤸🏼",
  "🤸🏽‍♀️",
  "🤸🏽‍♂️",
  "🤸🏽",
  "🤸🏾‍♀️",
  "🤸🏾‍♂️",
  "🤸🏾",
  "🤸🏿‍♀️",
  "🤸🏿‍♂️",
  "🤸🏿",
  "🤸‍♀️",
  "🤸‍♂️",
  "🤸",
  "🤹🏻‍♀️",
  "🤹🏻‍♂️",
  "🤹🏻",
  "🤹🏼‍♀️",
  "🤹🏼‍♂️",
  "🤹🏼",
  "🤹🏽‍♀️",
  "🤹🏽‍♂️",
  "🤹🏽",
  "🤹🏾‍♀️",
  "🤹🏾‍♂️",
  "🤹🏾",
  "🤹🏿‍♀️",
  "🤹🏿‍♂️",
  "🤹🏿",
  "🤹‍♀️",
  "🤹‍♂️",
  "🤹",
  "🤺",
  "🤼‍♀️",
  "🤼‍♂️",
  "🤼",
  "🤽🏻‍♀️",
  "🤽🏻‍♂️",
  "🤽🏻",
  "🤽🏼‍♀️",
  "🤽🏼‍♂️",
  "🤽🏼",
  "🤽🏽‍♀️",
  "🤽🏽‍♂️",
  "🤽🏽",
  "🤽🏾‍♀️",
  "🤽🏾‍♂️",
  "🤽🏾",
  "🤽🏿‍♀️",
  "🤽🏿‍♂️",
  "🤽🏿",
  "🤽‍♀️",
  "🤽‍♂️",
  "🤽",
  "🤾🏻‍♀️",
  "🤾🏻‍♂️",
  "🤾🏻",
  "🤾🏼‍♀️",
  "🤾🏼‍♂️",
  "🤾🏼",
  "🤾🏽‍♀️",
  "🤾🏽‍♂️",
  "🤾🏽",
  "🤾🏾‍♀️",
  "🤾🏾‍♂️",
  "🤾🏾",
  "🤾🏿‍♀️",
  "🤾🏿‍♂️",
  "🤾🏿",
  "🤾‍♀️",
  "🤾‍♂️",
  "🤾",
  "🤿",
  "🥀",
  "🥁",
  "🥂",
  "🥃",
  "🥄",
  "🥅",
  "🥇",
  "🥈",
  "🥉",
  "🥊",
  "🥋",
  "🥌",
  "🥍",
  "🥎",
  "🥏",
  "🥐",
  "🥑",
  "🥒",
  "🥓",
  "🥔",
  "🥕",
  "🥖",
  "🥗",
  "🥘",
  "🥙",
  "🥚",
  "🥛",
  "🥜",
  "🥝",
  "🥞",
  "🥟",
  "🥠",
  "🥡",
  "🥢",
  "🥣",
  "🥤",
  "🥥",
  "🥦",
  "🥧",
  "🥨",
  "🥩",
  "🥪",
  "🥫",
  "🥬",
  "🥭",
  "🥮",
  "🥯",
  "🥰",
  "🥱",
  "🥳",
  "🥴",
  "🥵",
  "🥶",
  "🥺",
  "🥻",
  "🥼",
  "🥽",
  "🥾",
  "🥿",
  "🦀",
  "🦁",
  "🦂",
  "🦃",
  "🦄",
  "🦅",
  "🦆",
  "🦇",
  "🦈",
  "🦉",
  "🦊",
  "🦋",
  "🦌",
  "🦍",
  "🦎",
  "🦏",
  "🦐",
  "🦑",
  "🦒",
  "🦓",
  "🦔",
  "🦕",
  "🦖",
  "🦗",
  "🦘",
  "🦙",
  "🦚",
  "🦛",
  "🦜",
  "🦝",
  "🦞",
  "🦟",
  "🦠",
  "🦡",
  "🦢",
  "🦥",
  "🦦",
  "🦧",
  "🦨",
  "🦩",
  "🦪",
  "🦮",
  "🦯",
  "🦰",
  "🦱",
  "🦲",
  "🦳",
  "🦴",
  "🦵🏻",
  "🦵🏼",
  "🦵🏽",
  "🦵🏾",
  "🦵🏿",
  "🦵",
  "🦶🏻",
  "🦶🏼",
  "🦶🏽",
  "🦶🏾",
  "🦶🏿",
  "🦶",
  "🦷",
  "🦸🏻‍♀️",
  "🦸🏻‍♂️",
  "🦸🏻",
  "🦸🏼‍♀️",
  "🦸🏼‍♂️",
  "🦸🏼",
  "🦸🏽‍♀️",
  "🦸🏽‍♂️",
  "🦸🏽",
  "🦸🏾‍♀️",
  "🦸🏾‍♂️",
  "🦸🏾",
  "🦸🏿‍♀️",
  "🦸🏿‍♂️",
  "🦸🏿",
  "🦸‍♀️",
  "🦸‍♂️",
  "🦸",
  "🦹🏻‍♀️",
  "🦹🏻‍♂️",
  "🦹🏻",
  "🦹🏼‍♀️",
  "🦹🏼‍♂️",
  "🦹🏼",
  "🦹🏽‍♀️",
  "🦹🏽‍♂️",
  "🦹🏽",
  "🦹🏾‍♀️",
  "🦹🏾‍♂️",
  "🦹🏾",
  "🦹🏿‍♀️",
  "🦹🏿‍♂️",
  "🦹🏿",
  "🦹‍♀️",
  "🦹‍♂️",
  "🦹",
  "🦺",
  "🦻🏻",
  "🦻🏼",
  "🦻🏽",
  "🦻🏾",
  "🦻🏿",
  "🦻",
  "🦼",
  "🦽",
  "🦾",
  "🦿",
  "🧀",
  "🧁",
  "🧂",
  "🧃",
  "🧄",
  "🧅",
  "🧆",
  "🧇",
  "🧈",
  "🧉",
  "🧊",
  "🧍🏻‍♀️",
  "🧍🏻‍♂️",
  "🧍🏻",
  "🧍🏼‍♀️",
  "🧍🏼‍♂️",
  "🧍🏼",
  "🧍🏽‍♀️",
  "🧍🏽‍♂️",
  "🧍🏽",
  "🧍🏾‍♀️",
  "🧍🏾‍♂️",
  "🧍🏾",
  "🧍🏿‍♀️",
  "🧍🏿‍♂️",
  "🧍🏿",
  "🧍‍♀️",
  "🧍‍♂️",
  "🧍",
  "🧎🏻‍♀️",
  "🧎🏻‍♂️",
  "🧎🏻",
  "🧎🏼‍♀️",
  "🧎🏼‍♂️",
  "🧎🏼",
  "🧎🏽‍♀️",
  "🧎🏽‍♂️",
  "🧎🏽",
  "🧎🏾‍♀️",
  "🧎🏾‍♂️",
  "🧎🏾",
  "🧎🏿‍♀️",
  "🧎🏿‍♂️",
  "🧎🏿",
  "🧎‍♀️",
  "🧎‍♂️",
  "🧎",
  "🧏🏻‍♀️",
  "🧏🏻‍♂️",
  "🧏🏻",
  "🧏🏼‍♀️",
  "🧏🏼‍♂️",
  "🧏🏼",
  "🧏🏽‍♀️",
  "🧏🏽‍♂️",
  "🧏🏽",
  "🧏🏾‍♀️",
  "🧏🏾‍♂️",
  "🧏🏾",
  "🧏🏿‍♀️",
  "🧏🏿‍♂️",
  "🧏🏿",
  "🧏‍♀️",
  "🧏‍♂️",
  "🧏",
  "🧐",
  "🧑🏻‍🤝‍🧑🏻",
  "🧑🏻",
  "🧑🏼‍🤝‍🧑🏻",
  "🧑🏼‍🤝‍🧑🏼",
  "🧑🏼",
  "🧑🏽‍🤝‍🧑🏻",
  "🧑🏽‍🤝‍🧑🏼",
  "🧑🏽‍🤝‍🧑🏽",
  "🧑🏽",
  "🧑🏾‍🤝‍🧑🏻",
  "🧑🏾‍🤝‍🧑🏼",
  "🧑🏾‍🤝‍🧑🏽",
  "🧑🏾‍🤝‍🧑🏾",
  "🧑🏾",
  "🧑🏿‍🤝‍🧑🏻",
  "🧑🏿‍🤝‍🧑🏼",
  "🧑🏿‍🤝‍🧑🏽",
  "🧑🏿‍🤝‍🧑🏾",
  "🧑🏿‍🤝‍🧑🏿",
  "🧑🏿",
  "🧑‍🤝‍🧑",
  "🧑",
  "🧒🏻",
  "🧒🏼",
  "🧒🏽",
  "🧒🏾",
  "🧒🏿",
  "🧒",
  "🧓🏻",
  "🧓🏼",
  "🧓🏽",
  "🧓🏾",
  "🧓🏿",
  "🧓",
  "🧔🏻",
  "🧔🏼",
  "🧔🏽",
  "🧔🏾",
  "🧔🏿",
  "🧔",
  "🧕🏻",
  "🧕🏼",
  "🧕🏽",
  "🧕🏾",
  "🧕🏿",
  "🧕",
  "🧖🏻‍♀️",
  "🧖🏻‍♂️",
  "🧖🏻",
  "🧖🏼‍♀️",
  "🧖🏼‍♂️",
  "🧖🏼",
  "🧖🏽‍♀️",
  "🧖🏽‍♂️",
  "🧖🏽",
  "🧖🏾‍♀️",
  "🧖🏾‍♂️",
  "🧖🏾",
  "🧖🏿‍♀️",
  "🧖🏿‍♂️",
  "🧖🏿",
  "🧖‍♀️",
  "🧖‍♂️",
  "🧖",
  "🧗🏻‍♀️",
  "🧗🏻‍♂️",
  "🧗🏻",
  "🧗🏼‍♀️",
  "🧗🏼‍♂️",
  "🧗🏼",
  "🧗🏽‍♀️",
  "🧗🏽‍♂️",
  "🧗🏽",
  "🧗🏾‍♀️",
  "🧗🏾‍♂️",
  "🧗🏾",
  "🧗🏿‍♀️",
  "🧗🏿‍♂️",
  "🧗🏿",
  "🧗‍♀️",
  "🧗‍♂️",
  "🧗",
  "🧘🏻‍♀️",
  "🧘🏻‍♂️",
  "🧘🏻",
  "🧘🏼‍♀️",
  "🧘🏼‍♂️",
  "🧘🏼",
  "🧘🏽‍♀️",
  "🧘🏽‍♂️",
  "🧘🏽",
  "🧘🏾‍♀️",
  "🧘🏾‍♂️",
  "🧘🏾",
  "🧘🏿‍♀️",
  "🧘🏿‍♂️",
  "🧘🏿",
  "🧘‍♀️",
  "🧘‍♂️",
  "🧘",
  "🧙🏻‍♀️",
  "🧙🏻‍♂️",
  "🧙🏻",
  "🧙🏼‍♀️",
  "🧙🏼‍♂️",
  "🧙🏼",
  "🧙🏽‍♀️",
  "🧙🏽‍♂️",
  "🧙🏽",
  "🧙🏾‍♀️",
  "🧙🏾‍♂️",
  "🧙🏾",
  "🧙🏿‍♀️",
  "🧙🏿‍♂️",
  "🧙🏿",
  "🧙‍♀️",
  "🧙‍♂️",
  "🧙",
  "🧚🏻‍♀️",
  "🧚🏻‍♂️",
  "🧚🏻",
  "🧚🏼‍♀️",
  "🧚🏼‍♂️",
  "🧚🏼",
  "🧚🏽‍♀️",
  "🧚🏽‍♂️",
  "🧚🏽",
  "🧚🏾‍♀️",
  "🧚🏾‍♂️",
  "🧚🏾",
  "🧚🏿‍♀️",
  "🧚🏿‍♂️",
  "🧚🏿",
  "🧚‍♀️",
  "🧚‍♂️",
  "🧚",
  "🧛🏻‍♀️",
  "🧛🏻‍♂️",
  "🧛🏻",
  "🧛🏼‍♀️",
  "🧛🏼‍♂️",
  "🧛🏼",
  "🧛🏽‍♀️",
  "🧛🏽‍♂️",
  "🧛🏽",
  "🧛🏾‍♀️",
  "🧛🏾‍♂️",
  "🧛🏾",
  "🧛🏿‍♀️",
  "🧛🏿‍♂️",
  "🧛🏿",
  "🧛‍♀️",
  "🧛‍♂️",
  "🧛",
  "🧜🏻‍♀️",
  "🧜🏻‍♂️",
  "🧜🏻",
  "🧜🏼‍♀️",
  "🧜🏼‍♂️",
  "🧜🏼",
  "🧜🏽‍♀️",
  "🧜🏽‍♂️",
  "🧜🏽",
  "🧜🏾‍♀️",
  "🧜🏾‍♂️",
  "🧜🏾",
  "🧜🏿‍♀️",
  "🧜🏿‍♂️",
  "🧜🏿",
  "🧜‍♀️",
  "🧜‍♂️",
  "🧜",
  "🧝🏻‍♀️",
  "🧝🏻‍♂️",
  "🧝🏻",
  "🧝🏼‍♀️",
  "🧝🏼‍♂️",
  "🧝🏼",
  "🧝🏽‍♀️",
  "🧝🏽‍♂️",
  "🧝🏽",
  "🧝🏾‍♀️",
  "🧝🏾‍♂️",
  "🧝🏾",
  "🧝🏿‍♀️",
  "🧝🏿‍♂️",
  "🧝🏿",
  "🧝‍♀️",
  "🧝‍♂️",
  "🧝",
  "🧞‍♀️",
  "🧞‍♂️",
  "🧞",
  "🧟‍♀️",
  "🧟‍♂️",
  "🧟",
  "🧠",
  "🧡",
  "🧢",
  "🧣",
  "🧤",
  "🧥",
  "🧦",
  "🧧",
  "🧨",
  "🧩",
  "🧪",
  "🧫",
  "🧬",
  "🧭",
  "🧮",
  "🧯",
  "🧰",
  "🧱",
  "🧲",
  "🧳",
  "🧴",
  "🧵",
  "🧶",
  "🧷",
  "🧸",
  "🧹",
  "🧺",
  "🧻",
  "🧼",
  "🧽",
  "🧾",
  "🧿",
  "🩰",
  "🩱",
  "🩲",
  "🩳",
  "🩸",
  "🩹",
  "🩺",
  "🪀",
  "🪁",
  "🪂",
  "🪐",
  "🪑",
  "🪒",
  "🪓",
  "🪔",
  "🪕",
  "‼️",
  "⁉️",
  "™️",
  "ℹ️",
  "↔️",
  "↕️",
  "↖️",
  "↗️",
  "↘️",
  "↙️",
  "↩️",
  "↪️",
  "#⃣",
  "⌚️",
  "⌛️",
  "⌨️",
  "⏏️",
  "⏩",
  "⏪",
  "⏫",
  "⏬",
  "⏭️",
  "⏮️",
  "⏯️",
  "⏰",
  "⏱️",
  "⏲️",
  "⏳",
  "⏸️",
  "⏹️",
  "⏺️",
  "Ⓜ️",
  "▪️",
  "▫️",
  "▶️",
  "◀️",
  "◻️",
  "◼️",
  "◽️",
  "◾️",
  "☀️",
  "☁️",
  "☂️",
  "☃️",
  "☄️",
  "☎️",
  "☑️",
  "☔️",
  "☕️",
  "☘️",
  "☝🏻",
  "☝🏼",
  "☝🏽",
  "☝🏾",
  "☝🏿",
  "☝️",
  "☠️",
  "☢️",
  "☣️",
  "☦️",
  "☪️",
  "☮️",
  "☯️",
  "☸️",
  "☹️",
  "☺️",
  "♀️",
  "♂️",
  "♈️",
  "♉️",
  "♊️",
  "♋️",
  "♌️",
  "♍️",
  "♎️",
  "♏️",
  "♐️",
  "♑️",
  "♒️",
  "♓️",
  "♟️",
  "♠️",
  "♣️",
  "♥️",
  "♦️",
  "♨️",
  "♻️",
  "♾",
  "♿️",
  "⚒️",
  "⚓️",
  "⚔️",
  "⚕️",
  "⚖️",
  "⚗️",
  "⚙️",
  "⚛️",
  "⚜️",
  "⚠️",
  "⚡️",
  "⚪️",
  "⚫️",
  "⚰️",
  "⚱️",
  "⚽️",
  "⚾️",
  "⛄️",
  "⛅️",
  "⛈️",
  "⛎",
  "⛏️",
  "⛑️",
  "⛓️",
  "⛔️",
  "⛩️",
  "⛪️",
  "⛰️",
  "⛱️",
  "⛲️",
  "⛳️",
  "⛴️",
  "⛵️",
  "⛷🏻",
  "⛷🏼",
  "⛷🏽",
  "⛷🏾",
  "⛷🏿",
  "⛷️",
  "⛸️",
  "⛹🏻‍♀️",
  "⛹🏻‍♂️",
  "⛹🏻",
  "⛹🏼‍♀️",
  "⛹🏼‍♂️",
  "⛹🏼",
  "⛹🏽‍♀️",
  "⛹🏽‍♂️",
  "⛹🏽",
  "⛹🏾‍♀️",
  "⛹🏾‍♂️",
  "⛹🏾",
  "⛹🏿‍♀️",
  "⛹🏿‍♂️",
  "⛹🏿",
  "⛹️‍♀️",
  "⛹️‍♂️",
  "⛹️",
  "⛺️",
  "⛽️",
  "✂️",
  "✅",
  "✈️",
  "✉️",
  "✊🏻",
  "✊🏼",
  "✊🏽",
  "✊🏾",
  "✊🏿",
  "✊",
  "✋🏻",
  "✋🏼",
  "✋🏽",
  "✋🏾",
  "✋🏿",
  "✋",
  "✌🏻",
  "✌🏼",
  "✌🏽",
  "✌🏾",
  "✌🏿",
  "✌️",
  "✍🏻",
  "✍🏼",
  "✍🏽",
  "✍🏾",
  "✍🏿",
  "✍️",
  "✏️",
  "✒️",
  "✔️",
  "✖️",
  "✝️",
  "✡️",
  "✨",
  "✳️",
  "✴️",
  "❄️",
  "❇️",
  "❌",
  "❎",
  "❓",
  "❔",
  "❕",
  "❗️",
  "❣️",
  "❤️",
  "➕",
  "➖",
  "➗",
  "➡️",
  "➰",
  "➿",
  "⤴️",
  "⤵️",
  "*⃣",
  "⬅️",
  "⬆️",
  "⬇️",
  "⬛️",
  "⬜️",
  "⭐️",
  "⭕️",
  "0⃣",
  "〰️",
  "〽️",
  "1⃣",
  "2⃣",
  "㊗️",
  "㊙️",
  "3⃣",
  "4⃣",
  "5⃣",
  "6⃣",
  "7⃣",
  "8⃣",
  "9⃣",
  "©️",
  "®️",
  ""
]

/***/ }),

/***/ 1682:
/***/ ((module) => {

const createImports = (imports, postcss, mode = "rule") => {
  return Object.keys(imports).map((path) => {
    const aliases = imports[path];
    const declarations = Object.keys(aliases).map((key) =>
      postcss.decl({
        prop: key,
        value: aliases[key],
        raws: { before: "\n  " },
      })
    );

    const hasDeclarations = declarations.length > 0;

    const rule =
      mode === "rule"
        ? postcss.rule({
            selector: `:import('${path}')`,
            raws: { after: hasDeclarations ? "\n" : "" },
          })
        : postcss.atRule({
            name: "icss-import",
            params: `'${path}'`,
            raws: { after: hasDeclarations ? "\n" : "" },
          });

    if (hasDeclarations) {
      rule.append(declarations);
    }

    return rule;
  });
};

const createExports = (exports, postcss, mode = "rule") => {
  const declarations = Object.keys(exports).map((key) =>
    postcss.decl({
      prop: key,
      value: exports[key],
      raws: { before: "\n  " },
    })
  );

  if (declarations.length === 0) {
    return [];
  }
  const rule =
    mode === "rule"
      ? postcss.rule({
          selector: `:export`,
          raws: { after: "\n" },
        })
      : postcss.atRule({
          name: "icss-export",
          raws: { after: "\n" },
        });

  rule.append(declarations);

  return [rule];
};

const createICSSRules = (imports, exports, postcss, mode) => [
  ...createImports(imports, postcss, mode),
  ...createExports(exports, postcss, mode),
];

module.exports = createICSSRules;


/***/ }),

/***/ 7848:
/***/ ((module) => {

const importPattern = /^:import\(("[^"]*"|'[^']*'|[^"']+)\)$/;
const balancedQuotes = /^("[^"]*"|'[^']*'|[^"']+)$/;

const getDeclsObject = (rule) => {
  const object = {};

  rule.walkDecls((decl) => {
    const before = decl.raws.before ? decl.raws.before.trim() : "";

    object[before + decl.prop] = decl.value;
  });

  return object;
};
/**
 *
 * @param {string} css
 * @param {boolean} removeRules
 * @param {'auto' | 'rule' | 'at-rule'} mode
 */
const extractICSS = (css, removeRules = true, mode = "auto") => {
  const icssImports = {};
  const icssExports = {};

  function addImports(node, path) {
    const unquoted = path.replace(/'|"/g, "");
    icssImports[unquoted] = Object.assign(
      icssImports[unquoted] || {},
      getDeclsObject(node)
    );

    if (removeRules) {
      node.remove();
    }
  }

  function addExports(node) {
    Object.assign(icssExports, getDeclsObject(node));
    if (removeRules) {
      node.remove();
    }
  }

  css.each((node) => {
    if (node.type === "rule" && mode !== "at-rule") {
      if (node.selector.slice(0, 7) === ":import") {
        const matches = importPattern.exec(node.selector);

        if (matches) {
          addImports(node, matches[1]);
        }
      }

      if (node.selector === ":export") {
        addExports(node);
      }
    }

    if (node.type === "atrule" && mode !== "rule") {
      if (node.name === "icss-import") {
        const matches = balancedQuotes.exec(node.params);

        if (matches) {
          addImports(node, matches[1]);
        }
      }
      if (node.name === "icss-export") {
        addExports(node);
      }
    }
  });

  return { icssImports, icssExports };
};

module.exports = extractICSS;


/***/ }),

/***/ 4665:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const replaceValueSymbols = __nccwpck_require__(9292);
const replaceSymbols = __nccwpck_require__(4143);
const extractICSS = __nccwpck_require__(7848);
const createICSSRules = __nccwpck_require__(1682);

module.exports = {
  replaceValueSymbols,
  replaceSymbols,
  extractICSS,
  createICSSRules,
};


/***/ }),

/***/ 4143:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const replaceValueSymbols = __nccwpck_require__(9292);

const replaceSymbols = (css, replacements) => {
  css.walk((node) => {
    if (node.type === "decl" && node.value) {
      node.value = replaceValueSymbols(node.value.toString(), replacements);
    } else if (node.type === "rule" && node.selector) {
      node.selector = replaceValueSymbols(
        node.selector.toString(),
        replacements
      );
    } else if (node.type === "atrule" && node.params) {
      node.params = replaceValueSymbols(node.params.toString(), replacements);
    }
  });
};

module.exports = replaceSymbols;


/***/ }),

/***/ 9292:
/***/ ((module) => {

const matchValueName = /[$]?[\w-]+/g;

const replaceValueSymbols = (value, replacements) => {
  let matches;

  while ((matches = matchValueName.exec(value))) {
    const replacement = replacements[matches[0]];

    if (replacement) {
      value =
        value.slice(0, matches.index) +
        replacement +
        value.slice(matchValueName.lastIndex);

      matchValueName.lastIndex -= matches[0].length - replacement.length;
    }
  }

  return value;
};

module.exports = replaceValueSymbols;


/***/ }),

/***/ 6904:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const parse = __nccwpck_require__(6018)
const stringify = __nccwpck_require__(749)

const JSON5 = {
    parse,
    stringify,
}

module.exports = JSON5


/***/ }),

/***/ 6018:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const util = __nccwpck_require__(7393)

let source
let parseState
let stack
let pos
let line
let column
let token
let key
let root

module.exports = function parse (text, reviver) {
    source = String(text)
    parseState = 'start'
    stack = []
    pos = 0
    line = 1
    column = 0
    token = undefined
    key = undefined
    root = undefined

    do {
        token = lex()

        // This code is unreachable.
        // if (!parseStates[parseState]) {
        //     throw invalidParseState()
        // }

        parseStates[parseState]()
    } while (token.type !== 'eof')

    if (typeof reviver === 'function') {
        return internalize({'': root}, '', reviver)
    }

    return root
}

function internalize (holder, name, reviver) {
    const value = holder[name]
    if (value != null && typeof value === 'object') {
        for (const key in value) {
            const replacement = internalize(value, key, reviver)
            if (replacement === undefined) {
                delete value[key]
            } else {
                value[key] = replacement
            }
        }
    }

    return reviver.call(holder, name, value)
}

let lexState
let buffer
let doubleQuote
let sign
let c

function lex () {
    lexState = 'default'
    buffer = ''
    doubleQuote = false
    sign = 1

    for (;;) {
        c = peek()

        // This code is unreachable.
        // if (!lexStates[lexState]) {
        //     throw invalidLexState(lexState)
        // }

        const token = lexStates[lexState]()
        if (token) {
            return token
        }
    }
}

function peek () {
    if (source[pos]) {
        return String.fromCodePoint(source.codePointAt(pos))
    }
}

function read () {
    const c = peek()

    if (c === '\n') {
        line++
        column = 0
    } else if (c) {
        column += c.length
    } else {
        column++
    }

    if (c) {
        pos += c.length
    }

    return c
}

const lexStates = {
    default () {
        switch (c) {
        case '\t':
        case '\v':
        case '\f':
        case ' ':
        case '\u00A0':
        case '\uFEFF':
        case '\n':
        case '\r':
        case '\u2028':
        case '\u2029':
            read()
            return

        case '/':
            read()
            lexState = 'comment'
            return

        case undefined:
            read()
            return newToken('eof')
        }

        if (util.isSpaceSeparator(c)) {
            read()
            return
        }

        // This code is unreachable.
        // if (!lexStates[parseState]) {
        //     throw invalidLexState(parseState)
        // }

        return lexStates[parseState]()
    },

    comment () {
        switch (c) {
        case '*':
            read()
            lexState = 'multiLineComment'
            return

        case '/':
            read()
            lexState = 'singleLineComment'
            return
        }

        throw invalidChar(read())
    },

    multiLineComment () {
        switch (c) {
        case '*':
            read()
            lexState = 'multiLineCommentAsterisk'
            return

        case undefined:
            throw invalidChar(read())
        }

        read()
    },

    multiLineCommentAsterisk () {
        switch (c) {
        case '*':
            read()
            return

        case '/':
            read()
            lexState = 'default'
            return

        case undefined:
            throw invalidChar(read())
        }

        read()
        lexState = 'multiLineComment'
    },

    singleLineComment () {
        switch (c) {
        case '\n':
        case '\r':
        case '\u2028':
        case '\u2029':
            read()
            lexState = 'default'
            return

        case undefined:
            read()
            return newToken('eof')
        }

        read()
    },

    value () {
        switch (c) {
        case '{':
        case '[':
            return newToken('punctuator', read())

        case 'n':
            read()
            literal('ull')
            return newToken('null', null)

        case 't':
            read()
            literal('rue')
            return newToken('boolean', true)

        case 'f':
            read()
            literal('alse')
            return newToken('boolean', false)

        case '-':
        case '+':
            if (read() === '-') {
                sign = -1
            }

            lexState = 'sign'
            return

        case '.':
            buffer = read()
            lexState = 'decimalPointLeading'
            return

        case '0':
            buffer = read()
            lexState = 'zero'
            return

        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
            buffer = read()
            lexState = 'decimalInteger'
            return

        case 'I':
            read()
            literal('nfinity')
            return newToken('numeric', Infinity)

        case 'N':
            read()
            literal('aN')
            return newToken('numeric', NaN)

        case '"':
        case "'":
            doubleQuote = (read() === '"')
            buffer = ''
            lexState = 'string'
            return
        }

        throw invalidChar(read())
    },

    identifierNameStartEscape () {
        if (c !== 'u') {
            throw invalidChar(read())
        }

        read()
        const u = unicodeEscape()
        switch (u) {
        case '$':
        case '_':
            break

        default:
            if (!util.isIdStartChar(u)) {
                throw invalidIdentifier()
            }

            break
        }

        buffer += u
        lexState = 'identifierName'
    },

    identifierName () {
        switch (c) {
        case '$':
        case '_':
        case '\u200C':
        case '\u200D':
            buffer += read()
            return

        case '\\':
            read()
            lexState = 'identifierNameEscape'
            return
        }

        if (util.isIdContinueChar(c)) {
            buffer += read()
            return
        }

        return newToken('identifier', buffer)
    },

    identifierNameEscape () {
        if (c !== 'u') {
            throw invalidChar(read())
        }

        read()
        const u = unicodeEscape()
        switch (u) {
        case '$':
        case '_':
        case '\u200C':
        case '\u200D':
            break

        default:
            if (!util.isIdContinueChar(u)) {
                throw invalidIdentifier()
            }

            break
        }

        buffer += u
        lexState = 'identifierName'
    },

    sign () {
        switch (c) {
        case '.':
            buffer = read()
            lexState = 'decimalPointLeading'
            return

        case '0':
            buffer = read()
            lexState = 'zero'
            return

        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
            buffer = read()
            lexState = 'decimalInteger'
            return

        case 'I':
            read()
            literal('nfinity')
            return newToken('numeric', sign * Infinity)

        case 'N':
            read()
            literal('aN')
            return newToken('numeric', NaN)
        }

        throw invalidChar(read())
    },

    zero () {
        switch (c) {
        case '.':
            buffer += read()
            lexState = 'decimalPoint'
            return

        case 'e':
        case 'E':
            buffer += read()
            lexState = 'decimalExponent'
            return

        case 'x':
        case 'X':
            buffer += read()
            lexState = 'hexadecimal'
            return
        }

        return newToken('numeric', sign * 0)
    },

    decimalInteger () {
        switch (c) {
        case '.':
            buffer += read()
            lexState = 'decimalPoint'
            return

        case 'e':
        case 'E':
            buffer += read()
            lexState = 'decimalExponent'
            return
        }

        if (util.isDigit(c)) {
            buffer += read()
            return
        }

        return newToken('numeric', sign * Number(buffer))
    },

    decimalPointLeading () {
        if (util.isDigit(c)) {
            buffer += read()
            lexState = 'decimalFraction'
            return
        }

        throw invalidChar(read())
    },

    decimalPoint () {
        switch (c) {
        case 'e':
        case 'E':
            buffer += read()
            lexState = 'decimalExponent'
            return
        }

        if (util.isDigit(c)) {
            buffer += read()
            lexState = 'decimalFraction'
            return
        }

        return newToken('numeric', sign * Number(buffer))
    },

    decimalFraction () {
        switch (c) {
        case 'e':
        case 'E':
            buffer += read()
            lexState = 'decimalExponent'
            return
        }

        if (util.isDigit(c)) {
            buffer += read()
            return
        }

        return newToken('numeric', sign * Number(buffer))
    },

    decimalExponent () {
        switch (c) {
        case '+':
        case '-':
            buffer += read()
            lexState = 'decimalExponentSign'
            return
        }

        if (util.isDigit(c)) {
            buffer += read()
            lexState = 'decimalExponentInteger'
            return
        }

        throw invalidChar(read())
    },

    decimalExponentSign () {
        if (util.isDigit(c)) {
            buffer += read()
            lexState = 'decimalExponentInteger'
            return
        }

        throw invalidChar(read())
    },

    decimalExponentInteger () {
        if (util.isDigit(c)) {
            buffer += read()
            return
        }

        return newToken('numeric', sign * Number(buffer))
    },

    hexadecimal () {
        if (util.isHexDigit(c)) {
            buffer += read()
            lexState = 'hexadecimalInteger'
            return
        }

        throw invalidChar(read())
    },

    hexadecimalInteger () {
        if (util.isHexDigit(c)) {
            buffer += read()
            return
        }

        return newToken('numeric', sign * Number(buffer))
    },

    string () {
        switch (c) {
        case '\\':
            read()
            buffer += escape()
            return

        case '"':
            if (doubleQuote) {
                read()
                return newToken('string', buffer)
            }

            buffer += read()
            return

        case "'":
            if (!doubleQuote) {
                read()
                return newToken('string', buffer)
            }

            buffer += read()
            return

        case '\n':
        case '\r':
            throw invalidChar(read())

        case '\u2028':
        case '\u2029':
            separatorChar(c)
            break

        case undefined:
            throw invalidChar(read())
        }

        buffer += read()
    },

    start () {
        switch (c) {
        case '{':
        case '[':
            return newToken('punctuator', read())

        // This code is unreachable since the default lexState handles eof.
        // case undefined:
        //     return newToken('eof')
        }

        lexState = 'value'
    },

    beforePropertyName () {
        switch (c) {
        case '$':
        case '_':
            buffer = read()
            lexState = 'identifierName'
            return

        case '\\':
            read()
            lexState = 'identifierNameStartEscape'
            return

        case '}':
            return newToken('punctuator', read())

        case '"':
        case "'":
            doubleQuote = (read() === '"')
            lexState = 'string'
            return
        }

        if (util.isIdStartChar(c)) {
            buffer += read()
            lexState = 'identifierName'
            return
        }

        throw invalidChar(read())
    },

    afterPropertyName () {
        if (c === ':') {
            return newToken('punctuator', read())
        }

        throw invalidChar(read())
    },

    beforePropertyValue () {
        lexState = 'value'
    },

    afterPropertyValue () {
        switch (c) {
        case ',':
        case '}':
            return newToken('punctuator', read())
        }

        throw invalidChar(read())
    },

    beforeArrayValue () {
        if (c === ']') {
            return newToken('punctuator', read())
        }

        lexState = 'value'
    },

    afterArrayValue () {
        switch (c) {
        case ',':
        case ']':
            return newToken('punctuator', read())
        }

        throw invalidChar(read())
    },

    end () {
        // This code is unreachable since it's handled by the default lexState.
        // if (c === undefined) {
        //     read()
        //     return newToken('eof')
        // }

        throw invalidChar(read())
    },
}

function newToken (type, value) {
    return {
        type,
        value,
        line,
        column,
    }
}

function literal (s) {
    for (const c of s) {
        const p = peek()

        if (p !== c) {
            throw invalidChar(read())
        }

        read()
    }
}

function escape () {
    const c = peek()
    switch (c) {
    case 'b':
        read()
        return '\b'

    case 'f':
        read()
        return '\f'

    case 'n':
        read()
        return '\n'

    case 'r':
        read()
        return '\r'

    case 't':
        read()
        return '\t'

    case 'v':
        read()
        return '\v'

    case '0':
        read()
        if (util.isDigit(peek())) {
            throw invalidChar(read())
        }

        return '\0'

    case 'x':
        read()
        return hexEscape()

    case 'u':
        read()
        return unicodeEscape()

    case '\n':
    case '\u2028':
    case '\u2029':
        read()
        return ''

    case '\r':
        read()
        if (peek() === '\n') {
            read()
        }

        return ''

    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
    case '7':
    case '8':
    case '9':
        throw invalidChar(read())

    case undefined:
        throw invalidChar(read())
    }

    return read()
}

function hexEscape () {
    let buffer = ''
    let c = peek()

    if (!util.isHexDigit(c)) {
        throw invalidChar(read())
    }

    buffer += read()

    c = peek()
    if (!util.isHexDigit(c)) {
        throw invalidChar(read())
    }

    buffer += read()

    return String.fromCodePoint(parseInt(buffer, 16))
}

function unicodeEscape () {
    let buffer = ''
    let count = 4

    while (count-- > 0) {
        const c = peek()
        if (!util.isHexDigit(c)) {
            throw invalidChar(read())
        }

        buffer += read()
    }

    return String.fromCodePoint(parseInt(buffer, 16))
}

const parseStates = {
    start () {
        if (token.type === 'eof') {
            throw invalidEOF()
        }

        push()
    },

    beforePropertyName () {
        switch (token.type) {
        case 'identifier':
        case 'string':
            key = token.value
            parseState = 'afterPropertyName'
            return

        case 'punctuator':
            // This code is unreachable since it's handled by the lexState.
            // if (token.value !== '}') {
            //     throw invalidToken()
            // }

            pop()
            return

        case 'eof':
            throw invalidEOF()
        }

        // This code is unreachable since it's handled by the lexState.
        // throw invalidToken()
    },

    afterPropertyName () {
        // This code is unreachable since it's handled by the lexState.
        // if (token.type !== 'punctuator' || token.value !== ':') {
        //     throw invalidToken()
        // }

        if (token.type === 'eof') {
            throw invalidEOF()
        }

        parseState = 'beforePropertyValue'
    },

    beforePropertyValue () {
        if (token.type === 'eof') {
            throw invalidEOF()
        }

        push()
    },

    beforeArrayValue () {
        if (token.type === 'eof') {
            throw invalidEOF()
        }

        if (token.type === 'punctuator' && token.value === ']') {
            pop()
            return
        }

        push()
    },

    afterPropertyValue () {
        // This code is unreachable since it's handled by the lexState.
        // if (token.type !== 'punctuator') {
        //     throw invalidToken()
        // }

        if (token.type === 'eof') {
            throw invalidEOF()
        }

        switch (token.value) {
        case ',':
            parseState = 'beforePropertyName'
            return

        case '}':
            pop()
        }

        // This code is unreachable since it's handled by the lexState.
        // throw invalidToken()
    },

    afterArrayValue () {
        // This code is unreachable since it's handled by the lexState.
        // if (token.type !== 'punctuator') {
        //     throw invalidToken()
        // }

        if (token.type === 'eof') {
            throw invalidEOF()
        }

        switch (token.value) {
        case ',':
            parseState = 'beforeArrayValue'
            return

        case ']':
            pop()
        }

        // This code is unreachable since it's handled by the lexState.
        // throw invalidToken()
    },

    end () {
        // This code is unreachable since it's handled by the lexState.
        // if (token.type !== 'eof') {
        //     throw invalidToken()
        // }
    },
}

function push () {
    let value

    switch (token.type) {
    case 'punctuator':
        switch (token.value) {
        case '{':
            value = {}
            break

        case '[':
            value = []
            break
        }

        break

    case 'null':
    case 'boolean':
    case 'numeric':
    case 'string':
        value = token.value
        break

    // This code is unreachable.
    // default:
    //     throw invalidToken()
    }

    if (root === undefined) {
        root = value
    } else {
        const parent = stack[stack.length - 1]
        if (Array.isArray(parent)) {
            parent.push(value)
        } else {
            parent[key] = value
        }
    }

    if (value !== null && typeof value === 'object') {
        stack.push(value)

        if (Array.isArray(value)) {
            parseState = 'beforeArrayValue'
        } else {
            parseState = 'beforePropertyName'
        }
    } else {
        const current = stack[stack.length - 1]
        if (current == null) {
            parseState = 'end'
        } else if (Array.isArray(current)) {
            parseState = 'afterArrayValue'
        } else {
            parseState = 'afterPropertyValue'
        }
    }
}

function pop () {
    stack.pop()

    const current = stack[stack.length - 1]
    if (current == null) {
        parseState = 'end'
    } else if (Array.isArray(current)) {
        parseState = 'afterArrayValue'
    } else {
        parseState = 'afterPropertyValue'
    }
}

// This code is unreachable.
// function invalidParseState () {
//     return new Error(`JSON5: invalid parse state '${parseState}'`)
// }

// This code is unreachable.
// function invalidLexState (state) {
//     return new Error(`JSON5: invalid lex state '${state}'`)
// }

function invalidChar (c) {
    if (c === undefined) {
        return syntaxError(`JSON5: invalid end of input at ${line}:${column}`)
    }

    return syntaxError(`JSON5: invalid character '${formatChar(c)}' at ${line}:${column}`)
}

function invalidEOF () {
    return syntaxError(`JSON5: invalid end of input at ${line}:${column}`)
}

// This code is unreachable.
// function invalidToken () {
//     if (token.type === 'eof') {
//         return syntaxError(`JSON5: invalid end of input at ${line}:${column}`)
//     }

//     const c = String.fromCodePoint(token.value.codePointAt(0))
//     return syntaxError(`JSON5: invalid character '${formatChar(c)}' at ${line}:${column}`)
// }

function invalidIdentifier () {
    column -= 5
    return syntaxError(`JSON5: invalid identifier character at ${line}:${column}`)
}

function separatorChar (c) {
    console.warn(`JSON5: '${formatChar(c)}' in strings is not valid ECMAScript; consider escaping`)
}

function formatChar (c) {
    const replacements = {
        "'": "\\'",
        '"': '\\"',
        '\\': '\\\\',
        '\b': '\\b',
        '\f': '\\f',
        '\n': '\\n',
        '\r': '\\r',
        '\t': '\\t',
        '\v': '\\v',
        '\0': '\\0',
        '\u2028': '\\u2028',
        '\u2029': '\\u2029',
    }

    if (replacements[c]) {
        return replacements[c]
    }

    if (c < ' ') {
        const hexString = c.charCodeAt(0).toString(16)
        return '\\x' + ('00' + hexString).substring(hexString.length)
    }

    return c
}

function syntaxError (message) {
    const err = new SyntaxError(message)
    err.lineNumber = line
    err.columnNumber = column
    return err
}


/***/ }),

/***/ 749:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const util = __nccwpck_require__(7393)

module.exports = function stringify (value, replacer, space) {
    const stack = []
    let indent = ''
    let propertyList
    let replacerFunc
    let gap = ''
    let quote

    if (
        replacer != null &&
        typeof replacer === 'object' &&
        !Array.isArray(replacer)
    ) {
        space = replacer.space
        quote = replacer.quote
        replacer = replacer.replacer
    }

    if (typeof replacer === 'function') {
        replacerFunc = replacer
    } else if (Array.isArray(replacer)) {
        propertyList = []
        for (const v of replacer) {
            let item

            if (typeof v === 'string') {
                item = v
            } else if (
                typeof v === 'number' ||
                v instanceof String ||
                v instanceof Number
            ) {
                item = String(v)
            }

            if (item !== undefined && propertyList.indexOf(item) < 0) {
                propertyList.push(item)
            }
        }
    }

    if (space instanceof Number) {
        space = Number(space)
    } else if (space instanceof String) {
        space = String(space)
    }

    if (typeof space === 'number') {
        if (space > 0) {
            space = Math.min(10, Math.floor(space))
            gap = '          '.substr(0, space)
        }
    } else if (typeof space === 'string') {
        gap = space.substr(0, 10)
    }

    return serializeProperty('', {'': value})

    function serializeProperty (key, holder) {
        let value = holder[key]
        if (value != null) {
            if (typeof value.toJSON5 === 'function') {
                value = value.toJSON5(key)
            } else if (typeof value.toJSON === 'function') {
                value = value.toJSON(key)
            }
        }

        if (replacerFunc) {
            value = replacerFunc.call(holder, key, value)
        }

        if (value instanceof Number) {
            value = Number(value)
        } else if (value instanceof String) {
            value = String(value)
        } else if (value instanceof Boolean) {
            value = value.valueOf()
        }

        switch (value) {
        case null: return 'null'
        case true: return 'true'
        case false: return 'false'
        }

        if (typeof value === 'string') {
            return quoteString(value, false)
        }

        if (typeof value === 'number') {
            return String(value)
        }

        if (typeof value === 'object') {
            return Array.isArray(value) ? serializeArray(value) : serializeObject(value)
        }

        return undefined
    }

    function quoteString (value) {
        const quotes = {
            "'": 0.1,
            '"': 0.2,
        }

        const replacements = {
            "'": "\\'",
            '"': '\\"',
            '\\': '\\\\',
            '\b': '\\b',
            '\f': '\\f',
            '\n': '\\n',
            '\r': '\\r',
            '\t': '\\t',
            '\v': '\\v',
            '\0': '\\0',
            '\u2028': '\\u2028',
            '\u2029': '\\u2029',
        }

        let product = ''

        for (let i = 0; i < value.length; i++) {
            const c = value[i]
            switch (c) {
            case "'":
            case '"':
                quotes[c]++
                product += c
                continue

            case '\0':
                if (util.isDigit(value[i + 1])) {
                    product += '\\x00'
                    continue
                }
            }

            if (replacements[c]) {
                product += replacements[c]
                continue
            }

            if (c < ' ') {
                let hexString = c.charCodeAt(0).toString(16)
                product += '\\x' + ('00' + hexString).substring(hexString.length)
                continue
            }

            product += c
        }

        const quoteChar = quote || Object.keys(quotes).reduce((a, b) => (quotes[a] < quotes[b]) ? a : b)

        product = product.replace(new RegExp(quoteChar, 'g'), replacements[quoteChar])

        return quoteChar + product + quoteChar
    }

    function serializeObject (value) {
        if (stack.indexOf(value) >= 0) {
            throw TypeError('Converting circular structure to JSON5')
        }

        stack.push(value)

        let stepback = indent
        indent = indent + gap

        let keys = propertyList || Object.keys(value)
        let partial = []
        for (const key of keys) {
            const propertyString = serializeProperty(key, value)
            if (propertyString !== undefined) {
                let member = serializeKey(key) + ':'
                if (gap !== '') {
                    member += ' '
                }
                member += propertyString
                partial.push(member)
            }
        }

        let final
        if (partial.length === 0) {
            final = '{}'
        } else {
            let properties
            if (gap === '') {
                properties = partial.join(',')
                final = '{' + properties + '}'
            } else {
                let separator = ',\n' + indent
                properties = partial.join(separator)
                final = '{\n' + indent + properties + ',\n' + stepback + '}'
            }
        }

        stack.pop()
        indent = stepback
        return final
    }

    function serializeKey (key) {
        if (key.length === 0) {
            return quoteString(key, true)
        }

        const firstChar = String.fromCodePoint(key.codePointAt(0))
        if (!util.isIdStartChar(firstChar)) {
            return quoteString(key, true)
        }

        for (let i = firstChar.length; i < key.length; i++) {
            if (!util.isIdContinueChar(String.fromCodePoint(key.codePointAt(i)))) {
                return quoteString(key, true)
            }
        }

        return key
    }

    function serializeArray (value) {
        if (stack.indexOf(value) >= 0) {
            throw TypeError('Converting circular structure to JSON5')
        }

        stack.push(value)

        let stepback = indent
        indent = indent + gap

        let partial = []
        for (let i = 0; i < value.length; i++) {
            const propertyString = serializeProperty(String(i), value)
            partial.push((propertyString !== undefined) ? propertyString : 'null')
        }

        let final
        if (partial.length === 0) {
            final = '[]'
        } else {
            if (gap === '') {
                let properties = partial.join(',')
                final = '[' + properties + ']'
            } else {
                let separator = ',\n' + indent
                let properties = partial.join(separator)
                final = '[\n' + indent + properties + ',\n' + stepback + ']'
            }
        }

        stack.pop()
        indent = stepback
        return final
    }
}


/***/ }),

/***/ 1927:
/***/ ((module) => {

// This is a generated file. Do not edit.
module.exports.Space_Separator = /[\u1680\u2000-\u200A\u202F\u205F\u3000]/
module.exports.ID_Start = /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312E\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEA\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF19]|\uD806[\uDCA0-\uDCDF\uDCFF\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE83\uDE86-\uDE89\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]/
module.exports.ID_Continue = /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u08D4-\u08E1\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u09FC\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9-\u0AFF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C80-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D00-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D54-\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1C80-\u1C88\u1CD0-\u1CD2\u1CD4-\u1CF9\u1D00-\u1DF9\u1DFB-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312E\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEA\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDCA-\uDDCC\uDDD0-\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE37\uDE3E\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC00-\uDC4A\uDC50-\uDC59\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDDD8-\uDDDD\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9\uDF00-\uDF19\uDF1D-\uDF2B\uDF30-\uDF39]|\uD806[\uDCA0-\uDCE9\uDCFF\uDE00-\uDE3E\uDE47\uDE50-\uDE83\uDE86-\uDE99\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC36\uDC38-\uDC40\uDC50-\uDC59\uDC72-\uDC8F\uDC92-\uDCA7\uDCA9-\uDCB6\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD36\uDD3A\uDD3C\uDD3D\uDD3F-\uDD47\uDD50-\uDD59]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6\uDD00-\uDD4A\uDD50-\uDD59]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/


/***/ }),

/***/ 7393:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const unicode = __nccwpck_require__(1927)

module.exports = {
    isSpaceSeparator (c) {
        return typeof c === 'string' && unicode.Space_Separator.test(c)
    },

    isIdStartChar (c) {
        return typeof c === 'string' && (
            (c >= 'a' && c <= 'z') ||
        (c >= 'A' && c <= 'Z') ||
        (c === '$') || (c === '_') ||
        unicode.ID_Start.test(c)
        )
    },

    isIdContinueChar (c) {
        return typeof c === 'string' && (
            (c >= 'a' && c <= 'z') ||
        (c >= 'A' && c <= 'Z') ||
        (c >= '0' && c <= '9') ||
        (c === '$') || (c === '_') ||
        (c === '\u200C') || (c === '\u200D') ||
        unicode.ID_Continue.test(c)
        )
    },

    isDigit (c) {
        return typeof c === 'string' && /[0-9]/.test(c)
    },

    isHexDigit (c) {
        return typeof c === 'string' && /[0-9A-Fa-f]/.test(c)
    },
}


/***/ }),

/***/ 2821:
/***/ ((module) => {

"use strict";


function getCurrentRequest(loaderContext) {
  if (loaderContext.currentRequest) {
    return loaderContext.currentRequest;
  }

  const request = loaderContext.loaders
    .slice(loaderContext.loaderIndex)
    .map((obj) => obj.request)
    .concat([loaderContext.resource]);

  return request.join('!');
}

module.exports = getCurrentRequest;


/***/ }),

/***/ 3567:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


const baseEncodeTables = {
  26: 'abcdefghijklmnopqrstuvwxyz',
  32: '123456789abcdefghjkmnpqrstuvwxyz', // no 0lio
  36: '0123456789abcdefghijklmnopqrstuvwxyz',
  49: 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ', // no lIO
  52: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  58: '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ', // no 0lIO
  62: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  64: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_',
};

function encodeBufferToBase(buffer, base) {
  const encodeTable = baseEncodeTables[base];
  if (!encodeTable) {
    throw new Error('Unknown encoding base' + base);
  }

  const readLength = buffer.length;
  const Big = __nccwpck_require__(8738);

  Big.RM = Big.DP = 0;
  let b = new Big(0);

  for (let i = readLength - 1; i >= 0; i--) {
    b = b.times(256).plus(buffer[i]);
  }

  let output = '';
  while (b.gt(0)) {
    output = encodeTable[b.mod(base)] + output;
    b = b.div(base);
  }

  Big.DP = 20;
  Big.RM = 1;

  return output;
}

function getHashDigest(buffer, hashType, digestType, maxLength) {
  hashType = hashType || 'md4';
  maxLength = maxLength || 9999;

  const hash = __nccwpck_require__(6417).createHash(hashType);

  hash.update(buffer);

  if (
    digestType === 'base26' ||
    digestType === 'base32' ||
    digestType === 'base36' ||
    digestType === 'base49' ||
    digestType === 'base52' ||
    digestType === 'base58' ||
    digestType === 'base62' ||
    digestType === 'base64'
  ) {
    return encodeBufferToBase(hash.digest(), digestType.substr(4)).substr(
      0,
      maxLength
    );
  } else {
    return hash.digest(digestType || 'hex').substr(0, maxLength);
  }
}

module.exports = getHashDigest;


/***/ }),

/***/ 6445:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


const parseQuery = __nccwpck_require__(5867);

function getOptions(loaderContext) {
  const query = loaderContext.query;

  if (typeof query === 'string' && query !== '') {
    return parseQuery(loaderContext.query);
  }

  if (!query || typeof query !== 'object') {
    // Not object-like queries are not supported.
    return {};
  }

  return query;
}

module.exports = getOptions;


/***/ }),

/***/ 8715:
/***/ ((module) => {

"use strict";


function getRemainingRequest(loaderContext) {
  if (loaderContext.remainingRequest) {
    return loaderContext.remainingRequest;
  }

  const request = loaderContext.loaders
    .slice(loaderContext.loaderIndex + 1)
    .map((obj) => obj.request)
    .concat([loaderContext.resource]);

  return request.join('!');
}

module.exports = getRemainingRequest;


/***/ }),

/***/ 3432:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";


const getOptions = __nccwpck_require__(6445);
const parseQuery = __nccwpck_require__(5867);
const stringifyRequest = __nccwpck_require__(4252);
const getRemainingRequest = __nccwpck_require__(8715);
const getCurrentRequest = __nccwpck_require__(2821);
const isUrlRequest = __nccwpck_require__(507);
const urlToRequest = __nccwpck_require__(2685);
const parseString = __nccwpck_require__(5784);
const getHashDigest = __nccwpck_require__(3567);
const interpolateName = __nccwpck_require__(939);

exports.getOptions = getOptions;
exports.parseQuery = parseQuery;
exports.stringifyRequest = stringifyRequest;
exports.getRemainingRequest = getRemainingRequest;
exports.getCurrentRequest = getCurrentRequest;
exports.isUrlRequest = isUrlRequest;
exports.urlToRequest = urlToRequest;
exports.parseString = parseString;
exports.getHashDigest = getHashDigest;
exports.interpolateName = interpolateName;


/***/ }),

/***/ 939:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


const path = __nccwpck_require__(5622);
const emojisList = __nccwpck_require__(3887);
const getHashDigest = __nccwpck_require__(3567);

const emojiRegex = /[\uD800-\uDFFF]./;
const emojiList = emojisList.filter((emoji) => emojiRegex.test(emoji));
const emojiCache = {};

function encodeStringToEmoji(content, length) {
  if (emojiCache[content]) {
    return emojiCache[content];
  }

  length = length || 1;

  const emojis = [];

  do {
    if (!emojiList.length) {
      throw new Error('Ran out of emoji');
    }

    const index = Math.floor(Math.random() * emojiList.length);

    emojis.push(emojiList[index]);
    emojiList.splice(index, 1);
  } while (--length > 0);

  const emojiEncoding = emojis.join('');

  emojiCache[content] = emojiEncoding;

  return emojiEncoding;
}

function interpolateName(loaderContext, name, options) {
  let filename;

  const hasQuery =
    loaderContext.resourceQuery && loaderContext.resourceQuery.length > 1;

  if (typeof name === 'function') {
    filename = name(
      loaderContext.resourcePath,
      hasQuery ? loaderContext.resourceQuery : undefined
    );
  } else {
    filename = name || '[hash].[ext]';
  }

  const context = options.context;
  const content = options.content;
  const regExp = options.regExp;

  let ext = 'bin';
  let basename = 'file';
  let directory = '';
  let folder = '';
  let query = '';

  if (loaderContext.resourcePath) {
    const parsed = path.parse(loaderContext.resourcePath);
    let resourcePath = loaderContext.resourcePath;

    if (parsed.ext) {
      ext = parsed.ext.substr(1);
    }

    if (parsed.dir) {
      basename = parsed.name;
      resourcePath = parsed.dir + path.sep;
    }

    if (typeof context !== 'undefined') {
      directory = path
        .relative(context, resourcePath + '_')
        .replace(/\\/g, '/')
        .replace(/\.\.(\/)?/g, '_$1');
      directory = directory.substr(0, directory.length - 1);
    } else {
      directory = resourcePath.replace(/\\/g, '/').replace(/\.\.(\/)?/g, '_$1');
    }

    if (directory.length === 1) {
      directory = '';
    } else if (directory.length > 1) {
      folder = path.basename(directory);
    }
  }

  if (loaderContext.resourceQuery && loaderContext.resourceQuery.length > 1) {
    query = loaderContext.resourceQuery;

    const hashIdx = query.indexOf('#');

    if (hashIdx >= 0) {
      query = query.substr(0, hashIdx);
    }
  }

  let url = filename;

  if (content) {
    // Match hash template
    url = url
      // `hash` and `contenthash` are same in `loader-utils` context
      // let's keep `hash` for backward compatibility
      .replace(
        /\[(?:([^:\]]+):)?(?:hash|contenthash)(?::([a-z]+\d*))?(?::(\d+))?\]/gi,
        (all, hashType, digestType, maxLength) =>
          getHashDigest(content, hashType, digestType, parseInt(maxLength, 10))
      )
      .replace(/\[emoji(?::(\d+))?\]/gi, (all, length) =>
        encodeStringToEmoji(content, parseInt(length, 10))
      );
  }

  url = url
    .replace(/\[ext\]/gi, () => ext)
    .replace(/\[name\]/gi, () => basename)
    .replace(/\[path\]/gi, () => directory)
    .replace(/\[folder\]/gi, () => folder)
    .replace(/\[query\]/gi, () => query);

  if (regExp && loaderContext.resourcePath) {
    const match = loaderContext.resourcePath.match(new RegExp(regExp));

    match &&
      match.forEach((matched, i) => {
        url = url.replace(new RegExp('\\[' + i + '\\]', 'ig'), matched);
      });
  }

  if (
    typeof loaderContext.options === 'object' &&
    typeof loaderContext.options.customInterpolateName === 'function'
  ) {
    url = loaderContext.options.customInterpolateName.call(
      loaderContext,
      url,
      name,
      options
    );
  }

  return url;
}

module.exports = interpolateName;


/***/ }),

/***/ 507:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


const path = __nccwpck_require__(5622);

function isUrlRequest(url, root) {
  // An URL is not an request if

  // 1. It's an absolute url and it is not `windows` path like `C:\dir\file`
  if (/^[a-z][a-z0-9+.-]*:/i.test(url) && !path.win32.isAbsolute(url)) {
    return false;
  }

  // 2. It's a protocol-relative
  if (/^\/\//.test(url)) {
    return false;
  }

  // 3. It's some kind of url for a template
  if (/^[{}[\]#*;,'§$%&(=?`´^°<>]/.test(url)) {
    return false;
  }

  // 4. It's also not an request if root isn't set and it's a root-relative url
  if ((root === undefined || root === false) && /^\//.test(url)) {
    return false;
  }

  return true;
}

module.exports = isUrlRequest;


/***/ }),

/***/ 5867:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


const JSON5 = __nccwpck_require__(6904);

const specialValues = {
  null: null,
  true: true,
  false: false,
};

function parseQuery(query) {
  if (query.substr(0, 1) !== '?') {
    throw new Error(
      "A valid query string passed to parseQuery should begin with '?'"
    );
  }

  query = query.substr(1);

  if (!query) {
    return {};
  }

  if (query.substr(0, 1) === '{' && query.substr(-1) === '}') {
    return JSON5.parse(query);
  }

  const queryArgs = query.split(/[,&]/g);
  const result = {};

  queryArgs.forEach((arg) => {
    const idx = arg.indexOf('=');

    if (idx >= 0) {
      let name = arg.substr(0, idx);
      let value = decodeURIComponent(arg.substr(idx + 1));

      // eslint-disable-next-line no-prototype-builtins
      if (specialValues.hasOwnProperty(value)) {
        value = specialValues[value];
      }

      if (name.substr(-2) === '[]') {
        name = decodeURIComponent(name.substr(0, name.length - 2));

        if (!Array.isArray(result[name])) {
          result[name] = [];
        }

        result[name].push(value);
      } else {
        name = decodeURIComponent(name);
        result[name] = value;
      }
    } else {
      if (arg.substr(0, 1) === '-') {
        result[decodeURIComponent(arg.substr(1))] = false;
      } else if (arg.substr(0, 1) === '+') {
        result[decodeURIComponent(arg.substr(1))] = true;
      } else {
        result[decodeURIComponent(arg)] = true;
      }
    }
  });

  return result;
}

module.exports = parseQuery;


/***/ }),

/***/ 5784:
/***/ ((module) => {

"use strict";


function parseString(str) {
  try {
    if (str[0] === '"') {
      return JSON.parse(str);
    }

    if (str[0] === "'" && str.substr(str.length - 1) === "'") {
      return parseString(
        str
          .replace(/\\.|"/g, (x) => (x === '"' ? '\\"' : x))
          .replace(/^'|'$/g, '"')
      );
    }

    return JSON.parse('"' + str + '"');
  } catch (e) {
    return str;
  }
}

module.exports = parseString;


/***/ }),

/***/ 4252:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


const path = __nccwpck_require__(5622);

const matchRelativePath = /^\.\.?[/\\]/;

function isAbsolutePath(str) {
  return path.posix.isAbsolute(str) || path.win32.isAbsolute(str);
}

function isRelativePath(str) {
  return matchRelativePath.test(str);
}

function stringifyRequest(loaderContext, request) {
  const splitted = request.split('!');
  const context =
    loaderContext.context ||
    (loaderContext.options && loaderContext.options.context);

  return JSON.stringify(
    splitted
      .map((part) => {
        // First, separate singlePath from query, because the query might contain paths again
        const splittedPart = part.match(/^(.*?)(\?.*)/);
        const query = splittedPart ? splittedPart[2] : '';
        let singlePath = splittedPart ? splittedPart[1] : part;

        if (isAbsolutePath(singlePath) && context) {
          singlePath = path.relative(context, singlePath);

          if (isAbsolutePath(singlePath)) {
            // If singlePath still matches an absolute path, singlePath was on a different drive than context.
            // In this case, we leave the path platform-specific without replacing any separators.
            // @see https://github.com/webpack/loader-utils/pull/14
            return singlePath + query;
          }

          if (isRelativePath(singlePath) === false) {
            // Ensure that the relative path starts at least with ./ otherwise it would be a request into the modules directory (like node_modules).
            singlePath = './' + singlePath;
          }
        }

        return singlePath.replace(/\\/g, '/') + query;
      })
      .join('!')
  );
}

module.exports = stringifyRequest;


/***/ }),

/***/ 2685:
/***/ ((module) => {

"use strict";


// we can't use path.win32.isAbsolute because it also matches paths starting with a forward slash
const matchNativeWin32Path = /^[A-Z]:[/\\]|^\\\\/i;

function urlToRequest(url, root) {
  // Do not rewrite an empty url
  if (url === '') {
    return '';
  }

  const moduleRequestRegex = /^[^?]*~/;
  let request;

  if (matchNativeWin32Path.test(url)) {
    // absolute windows path, keep it
    request = url;
  } else if (root !== undefined && root !== false && /^\//.test(url)) {
    // if root is set and the url is root-relative
    switch (typeof root) {
      // 1. root is a string: root is prefixed to the url
      case 'string':
        // special case: `~` roots convert to module request
        if (moduleRequestRegex.test(root)) {
          request = root.replace(/([^~/])$/, '$1/') + url.slice(1);
        } else {
          request = root + url;
        }
        break;
      // 2. root is `true`: absolute paths are allowed
      //    *nix only, windows-style absolute paths are always allowed as they doesn't start with a `/`
      case 'boolean':
        request = url;
        break;
      default:
        throw new Error(
          "Unexpected parameters to loader-utils 'urlToRequest': url = " +
            url +
            ', root = ' +
            root +
            '.'
        );
    }
  } else if (/^\.\.?\//.test(url)) {
    // A relative url stays
    request = url;
  } else {
    // every other url is threaded like a relative url
    request = './' + url;
  }

  // A `~` makes the url an module
  if (moduleRequestRegex.test(request)) {
    request = request.replace(moduleRequestRegex, '');
  }

  return request;
}

module.exports = urlToRequest;


/***/ }),

/***/ 7129:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


// A linked list to keep track of recently-used-ness
const Yallist = __nccwpck_require__(665)

const MAX = Symbol('max')
const LENGTH = Symbol('length')
const LENGTH_CALCULATOR = Symbol('lengthCalculator')
const ALLOW_STALE = Symbol('allowStale')
const MAX_AGE = Symbol('maxAge')
const DISPOSE = Symbol('dispose')
const NO_DISPOSE_ON_SET = Symbol('noDisposeOnSet')
const LRU_LIST = Symbol('lruList')
const CACHE = Symbol('cache')
const UPDATE_AGE_ON_GET = Symbol('updateAgeOnGet')

const naiveLength = () => 1

// lruList is a yallist where the head is the youngest
// item, and the tail is the oldest.  the list contains the Hit
// objects as the entries.
// Each Hit object has a reference to its Yallist.Node.  This
// never changes.
//
// cache is a Map (or PseudoMap) that matches the keys to
// the Yallist.Node object.
class LRUCache {
  constructor (options) {
    if (typeof options === 'number')
      options = { max: options }

    if (!options)
      options = {}

    if (options.max && (typeof options.max !== 'number' || options.max < 0))
      throw new TypeError('max must be a non-negative number')
    // Kind of weird to have a default max of Infinity, but oh well.
    const max = this[MAX] = options.max || Infinity

    const lc = options.length || naiveLength
    this[LENGTH_CALCULATOR] = (typeof lc !== 'function') ? naiveLength : lc
    this[ALLOW_STALE] = options.stale || false
    if (options.maxAge && typeof options.maxAge !== 'number')
      throw new TypeError('maxAge must be a number')
    this[MAX_AGE] = options.maxAge || 0
    this[DISPOSE] = options.dispose
    this[NO_DISPOSE_ON_SET] = options.noDisposeOnSet || false
    this[UPDATE_AGE_ON_GET] = options.updateAgeOnGet || false
    this.reset()
  }

  // resize the cache when the max changes.
  set max (mL) {
    if (typeof mL !== 'number' || mL < 0)
      throw new TypeError('max must be a non-negative number')

    this[MAX] = mL || Infinity
    trim(this)
  }
  get max () {
    return this[MAX]
  }

  set allowStale (allowStale) {
    this[ALLOW_STALE] = !!allowStale
  }
  get allowStale () {
    return this[ALLOW_STALE]
  }

  set maxAge (mA) {
    if (typeof mA !== 'number')
      throw new TypeError('maxAge must be a non-negative number')

    this[MAX_AGE] = mA
    trim(this)
  }
  get maxAge () {
    return this[MAX_AGE]
  }

  // resize the cache when the lengthCalculator changes.
  set lengthCalculator (lC) {
    if (typeof lC !== 'function')
      lC = naiveLength

    if (lC !== this[LENGTH_CALCULATOR]) {
      this[LENGTH_CALCULATOR] = lC
      this[LENGTH] = 0
      this[LRU_LIST].forEach(hit => {
        hit.length = this[LENGTH_CALCULATOR](hit.value, hit.key)
        this[LENGTH] += hit.length
      })
    }
    trim(this)
  }
  get lengthCalculator () { return this[LENGTH_CALCULATOR] }

  get length () { return this[LENGTH] }
  get itemCount () { return this[LRU_LIST].length }

  rforEach (fn, thisp) {
    thisp = thisp || this
    for (let walker = this[LRU_LIST].tail; walker !== null;) {
      const prev = walker.prev
      forEachStep(this, fn, walker, thisp)
      walker = prev
    }
  }

  forEach (fn, thisp) {
    thisp = thisp || this
    for (let walker = this[LRU_LIST].head; walker !== null;) {
      const next = walker.next
      forEachStep(this, fn, walker, thisp)
      walker = next
    }
  }

  keys () {
    return this[LRU_LIST].toArray().map(k => k.key)
  }

  values () {
    return this[LRU_LIST].toArray().map(k => k.value)
  }

  reset () {
    if (this[DISPOSE] &&
        this[LRU_LIST] &&
        this[LRU_LIST].length) {
      this[LRU_LIST].forEach(hit => this[DISPOSE](hit.key, hit.value))
    }

    this[CACHE] = new Map() // hash of items by key
    this[LRU_LIST] = new Yallist() // list of items in order of use recency
    this[LENGTH] = 0 // length of items in the list
  }

  dump () {
    return this[LRU_LIST].map(hit =>
      isStale(this, hit) ? false : {
        k: hit.key,
        v: hit.value,
        e: hit.now + (hit.maxAge || 0)
      }).toArray().filter(h => h)
  }

  dumpLru () {
    return this[LRU_LIST]
  }

  set (key, value, maxAge) {
    maxAge = maxAge || this[MAX_AGE]

    if (maxAge && typeof maxAge !== 'number')
      throw new TypeError('maxAge must be a number')

    const now = maxAge ? Date.now() : 0
    const len = this[LENGTH_CALCULATOR](value, key)

    if (this[CACHE].has(key)) {
      if (len > this[MAX]) {
        del(this, this[CACHE].get(key))
        return false
      }

      const node = this[CACHE].get(key)
      const item = node.value

      // dispose of the old one before overwriting
      // split out into 2 ifs for better coverage tracking
      if (this[DISPOSE]) {
        if (!this[NO_DISPOSE_ON_SET])
          this[DISPOSE](key, item.value)
      }

      item.now = now
      item.maxAge = maxAge
      item.value = value
      this[LENGTH] += len - item.length
      item.length = len
      this.get(key)
      trim(this)
      return true
    }

    const hit = new Entry(key, value, len, now, maxAge)

    // oversized objects fall out of cache automatically.
    if (hit.length > this[MAX]) {
      if (this[DISPOSE])
        this[DISPOSE](key, value)

      return false
    }

    this[LENGTH] += hit.length
    this[LRU_LIST].unshift(hit)
    this[CACHE].set(key, this[LRU_LIST].head)
    trim(this)
    return true
  }

  has (key) {
    if (!this[CACHE].has(key)) return false
    const hit = this[CACHE].get(key).value
    return !isStale(this, hit)
  }

  get (key) {
    return get(this, key, true)
  }

  peek (key) {
    return get(this, key, false)
  }

  pop () {
    const node = this[LRU_LIST].tail
    if (!node)
      return null

    del(this, node)
    return node.value
  }

  del (key) {
    del(this, this[CACHE].get(key))
  }

  load (arr) {
    // reset the cache
    this.reset()

    const now = Date.now()
    // A previous serialized cache has the most recent items first
    for (let l = arr.length - 1; l >= 0; l--) {
      const hit = arr[l]
      const expiresAt = hit.e || 0
      if (expiresAt === 0)
        // the item was created without expiration in a non aged cache
        this.set(hit.k, hit.v)
      else {
        const maxAge = expiresAt - now
        // dont add already expired items
        if (maxAge > 0) {
          this.set(hit.k, hit.v, maxAge)
        }
      }
    }
  }

  prune () {
    this[CACHE].forEach((value, key) => get(this, key, false))
  }
}

const get = (self, key, doUse) => {
  const node = self[CACHE].get(key)
  if (node) {
    const hit = node.value
    if (isStale(self, hit)) {
      del(self, node)
      if (!self[ALLOW_STALE])
        return undefined
    } else {
      if (doUse) {
        if (self[UPDATE_AGE_ON_GET])
          node.value.now = Date.now()
        self[LRU_LIST].unshiftNode(node)
      }
    }
    return hit.value
  }
}

const isStale = (self, hit) => {
  if (!hit || (!hit.maxAge && !self[MAX_AGE]))
    return false

  const diff = Date.now() - hit.now
  return hit.maxAge ? diff > hit.maxAge
    : self[MAX_AGE] && (diff > self[MAX_AGE])
}

const trim = self => {
  if (self[LENGTH] > self[MAX]) {
    for (let walker = self[LRU_LIST].tail;
      self[LENGTH] > self[MAX] && walker !== null;) {
      // We know that we're about to delete this one, and also
      // what the next least recently used key will be, so just
      // go ahead and set it now.
      const prev = walker.prev
      del(self, walker)
      walker = prev
    }
  }
}

const del = (self, node) => {
  if (node) {
    const hit = node.value
    if (self[DISPOSE])
      self[DISPOSE](hit.key, hit.value)

    self[LENGTH] -= hit.length
    self[CACHE].delete(hit.key)
    self[LRU_LIST].removeNode(node)
  }
}

class Entry {
  constructor (key, value, length, now, maxAge) {
    this.key = key
    this.value = value
    this.length = length
    this.now = now
    this.maxAge = maxAge || 0
  }
}

const forEachStep = (self, fn, node, thisp) => {
  let hit = node.value
  if (isStale(self, hit)) {
    del(self, node)
    if (!self[ALLOW_STALE])
      hit = undefined
  }
  if (hit)
    fn.call(thisp, hit.value, hit.key, self)
}

module.exports = LRUCache


/***/ }),

/***/ 4192:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const topologicalSort = __nccwpck_require__(118);

const matchImports = /^(.+?)\s+from\s+(?:"([^"]+)"|'([^']+)'|(global))$/;
const icssImport = /^:import\((?:"([^"]+)"|'([^']+)')\)/;

const VISITED_MARKER = 1;

/**
 * :import('G') {}
 *
 * Rule
 *   composes: ... from 'A'
 *   composes: ... from 'B'

 * Rule
 *   composes: ... from 'A'
 *   composes: ... from 'A'
 *   composes: ... from 'C'
 *
 * Results in:
 *
 * graph: {
 *   G: [],
 *   A: [],
 *   B: ['A'],
 *   C: ['A'],
 * }
 */
function addImportToGraph(importId, parentId, graph, visited) {
  const siblingsId = parentId + "_" + "siblings";
  const visitedId = parentId + "_" + importId;

  if (visited[visitedId] !== VISITED_MARKER) {
    if (!Array.isArray(visited[siblingsId])) {
      visited[siblingsId] = [];
    }

    const siblings = visited[siblingsId];

    if (Array.isArray(graph[importId])) {
      graph[importId] = graph[importId].concat(siblings);
    } else {
      graph[importId] = siblings.slice();
    }

    visited[visitedId] = VISITED_MARKER;

    siblings.push(importId);
  }
}

module.exports = (options = {}) => {
  let importIndex = 0;
  const createImportedName =
    typeof options.createImportedName !== "function"
      ? (importName /*, path*/) =>
          `i__imported_${importName.replace(/\W/g, "_")}_${importIndex++}`
      : options.createImportedName;
  const failOnWrongOrder = options.failOnWrongOrder;

  return {
    postcssPlugin: "postcss-modules-extract-imports",
    prepare() {
      const graph = {};
      const visited = {};
      const existingImports = {};
      const importDecls = {};
      const imports = {};

      return {
        Once(root, postcss) {
          // Check the existing imports order and save refs
          root.walkRules((rule) => {
            const matches = icssImport.exec(rule.selector);

            if (matches) {
              const [, /*match*/ doubleQuotePath, singleQuotePath] = matches;
              const importPath = doubleQuotePath || singleQuotePath;

              addImportToGraph(importPath, "root", graph, visited);

              existingImports[importPath] = rule;
            }
          });

          root.walkDecls(/^composes$/, (declaration) => {
            const matches = declaration.value.match(matchImports);

            if (!matches) {
              return;
            }

            let tmpSymbols;
            let [
              ,
              /*match*/ symbols,
              doubleQuotePath,
              singleQuotePath,
              global,
            ] = matches;

            if (global) {
              // Composing globals simply means changing these classes to wrap them in global(name)
              tmpSymbols = symbols.split(/\s+/).map((s) => `global(${s})`);
            } else {
              const importPath = doubleQuotePath || singleQuotePath;

              let parent = declaration.parent;
              let parentIndexes = "";

              while (parent.type !== "root") {
                parentIndexes =
                  parent.parent.index(parent) + "_" + parentIndexes;
                parent = parent.parent;
              }

              const { selector } = declaration.parent;
              const parentRule = `_${parentIndexes}${selector}`;

              addImportToGraph(importPath, parentRule, graph, visited);

              importDecls[importPath] = declaration;
              imports[importPath] = imports[importPath] || {};

              tmpSymbols = symbols.split(/\s+/).map((s) => {
                if (!imports[importPath][s]) {
                  imports[importPath][s] = createImportedName(s, importPath);
                }

                return imports[importPath][s];
              });
            }

            declaration.value = tmpSymbols.join(" ");
          });

          const importsOrder = topologicalSort(graph, failOnWrongOrder);

          if (importsOrder instanceof Error) {
            const importPath = importsOrder.nodes.find((importPath) =>
              // eslint-disable-next-line no-prototype-builtins
              importDecls.hasOwnProperty(importPath)
            );
            const decl = importDecls[importPath];

            throw decl.error(
              "Failed to resolve order of composed modules " +
                importsOrder.nodes
                  .map((importPath) => "`" + importPath + "`")
                  .join(", ") +
                ".",
              {
                plugin: "postcss-modules-extract-imports",
                word: "composes",
              }
            );
          }

          let lastImportRule;

          importsOrder.forEach((path) => {
            const importedSymbols = imports[path];
            let rule = existingImports[path];

            if (!rule && importedSymbols) {
              rule = postcss.rule({
                selector: `:import("${path}")`,
                raws: { after: "\n" },
              });

              if (lastImportRule) {
                root.insertAfter(lastImportRule, rule);
              } else {
                root.prepend(rule);
              }
            }

            lastImportRule = rule;

            if (!importedSymbols) {
              return;
            }

            Object.keys(importedSymbols).forEach((importedSymbol) => {
              rule.append(
                postcss.decl({
                  value: importedSymbol,
                  prop: importedSymbols[importedSymbol],
                  raws: { before: "\n  " },
                })
              );
            });
          });
        },
      };
    },
  };
};

module.exports.postcss = true;


/***/ }),

/***/ 118:
/***/ ((module) => {

const PERMANENT_MARKER = 2;
const TEMPORARY_MARKER = 1;

function createError(node, graph) {
  const er = new Error("Nondeterministic import's order");

  const related = graph[node];
  const relatedNode = related.find(
    (relatedNode) => graph[relatedNode].indexOf(node) > -1
  );

  er.nodes = [node, relatedNode];

  return er;
}

function walkGraph(node, graph, state, result, strict) {
  if (state[node] === PERMANENT_MARKER) {
    return;
  }

  if (state[node] === TEMPORARY_MARKER) {
    if (strict) {
      return createError(node, graph);
    }

    return;
  }

  state[node] = TEMPORARY_MARKER;

  const children = graph[node];
  const length = children.length;

  for (let i = 0; i < length; ++i) {
    const error = walkGraph(children[i], graph, state, result, strict);

    if (error instanceof Error) {
      return error;
    }
  }

  state[node] = PERMANENT_MARKER;

  result.push(node);
}

function topologicalSort(graph, strict) {
  const result = [];
  const state = {};

  const nodes = Object.keys(graph);
  const length = nodes.length;

  for (let i = 0; i < length; ++i) {
    const er = walkGraph(nodes[i], graph, state, result, strict);

    if (er instanceof Error) {
      return er;
    }
  }

  return result;
}

module.exports = topologicalSort;


/***/ }),

/***/ 9932:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


const selectorParser = __nccwpck_require__(2997);
const valueParser = __nccwpck_require__(9285);
const { extractICSS } = __nccwpck_require__(4665);

const isSpacing = (node) => node.type === "combinator" && node.value === " ";

function normalizeNodeArray(nodes) {
  const array = [];

  nodes.forEach((x) => {
    if (Array.isArray(x)) {
      normalizeNodeArray(x).forEach((item) => {
        array.push(item);
      });
    } else if (x) {
      array.push(x);
    }
  });

  if (array.length > 0 && isSpacing(array[array.length - 1])) {
    array.pop();
  }
  return array;
}

function localizeNode(rule, mode, localAliasMap) {
  const transform = (node, context) => {
    if (context.ignoreNextSpacing && !isSpacing(node)) {
      throw new Error("Missing whitespace after " + context.ignoreNextSpacing);
    }

    if (context.enforceNoSpacing && isSpacing(node)) {
      throw new Error("Missing whitespace before " + context.enforceNoSpacing);
    }

    let newNodes;

    switch (node.type) {
      case "root": {
        let resultingGlobal;

        context.hasPureGlobals = false;

        newNodes = node.nodes.map((n) => {
          const nContext = {
            global: context.global,
            lastWasSpacing: true,
            hasLocals: false,
            explicit: false,
          };

          n = transform(n, nContext);

          if (typeof resultingGlobal === "undefined") {
            resultingGlobal = nContext.global;
          } else if (resultingGlobal !== nContext.global) {
            throw new Error(
              'Inconsistent rule global/local result in rule "' +
                node +
                '" (multiple selectors must result in the same mode for the rule)'
            );
          }

          if (!nContext.hasLocals) {
            context.hasPureGlobals = true;
          }

          return n;
        });

        context.global = resultingGlobal;

        node.nodes = normalizeNodeArray(newNodes);
        break;
      }
      case "selector": {
        newNodes = node.map((childNode) => transform(childNode, context));

        node = node.clone();
        node.nodes = normalizeNodeArray(newNodes);
        break;
      }
      case "combinator": {
        if (isSpacing(node)) {
          if (context.ignoreNextSpacing) {
            context.ignoreNextSpacing = false;
            context.lastWasSpacing = false;
            context.enforceNoSpacing = false;
            return null;
          }
          context.lastWasSpacing = true;
          return node;
        }
        break;
      }
      case "pseudo": {
        let childContext;
        const isNested = !!node.length;
        const isScoped = node.value === ":local" || node.value === ":global";
        const isImportExport =
          node.value === ":import" || node.value === ":export";

        if (isImportExport) {
          context.hasLocals = true;
          // :local(.foo)
        } else if (isNested) {
          if (isScoped) {
            if (node.nodes.length === 0) {
              throw new Error(`${node.value}() can't be empty`);
            }

            if (context.inside) {
              throw new Error(
                `A ${node.value} is not allowed inside of a ${context.inside}(...)`
              );
            }

            childContext = {
              global: node.value === ":global",
              inside: node.value,
              hasLocals: false,
              explicit: true,
            };

            newNodes = node
              .map((childNode) => transform(childNode, childContext))
              .reduce((acc, next) => acc.concat(next.nodes), []);

            if (newNodes.length) {
              const { before, after } = node.spaces;

              const first = newNodes[0];
              const last = newNodes[newNodes.length - 1];

              first.spaces = { before, after: first.spaces.after };
              last.spaces = { before: last.spaces.before, after };
            }

            node = newNodes;

            break;
          } else {
            childContext = {
              global: context.global,
              inside: context.inside,
              lastWasSpacing: true,
              hasLocals: false,
              explicit: context.explicit,
            };
            newNodes = node.map((childNode) =>
              transform(childNode, childContext)
            );

            node = node.clone();
            node.nodes = normalizeNodeArray(newNodes);

            if (childContext.hasLocals) {
              context.hasLocals = true;
            }
          }
          break;

          //:local .foo .bar
        } else if (isScoped) {
          if (context.inside) {
            throw new Error(
              `A ${node.value} is not allowed inside of a ${context.inside}(...)`
            );
          }

          const addBackSpacing = !!node.spaces.before;

          context.ignoreNextSpacing = context.lastWasSpacing
            ? node.value
            : false;

          context.enforceNoSpacing = context.lastWasSpacing
            ? false
            : node.value;

          context.global = node.value === ":global";
          context.explicit = true;

          // because this node has spacing that is lost when we remove it
          // we make up for it by adding an extra combinator in since adding
          // spacing on the parent selector doesn't work
          return addBackSpacing
            ? selectorParser.combinator({ value: " " })
            : null;
        }
        break;
      }
      case "id":
      case "class": {
        if (!node.value) {
          throw new Error("Invalid class or id selector syntax");
        }

        if (context.global) {
          break;
        }

        const isImportedValue = localAliasMap.has(node.value);
        const isImportedWithExplicitScope = isImportedValue && context.explicit;

        if (!isImportedValue || isImportedWithExplicitScope) {
          const innerNode = node.clone();
          innerNode.spaces = { before: "", after: "" };

          node = selectorParser.pseudo({
            value: ":local",
            nodes: [innerNode],
            spaces: node.spaces,
          });

          context.hasLocals = true;
        }

        break;
      }
    }

    context.lastWasSpacing = false;
    context.ignoreNextSpacing = false;
    context.enforceNoSpacing = false;

    return node;
  };

  const rootContext = {
    global: mode === "global",
    hasPureGlobals: false,
  };

  rootContext.selector = selectorParser((root) => {
    transform(root, rootContext);
  }).processSync(rule, { updateSelector: false, lossless: true });

  return rootContext;
}

function localizeDeclNode(node, context) {
  switch (node.type) {
    case "word":
      if (context.localizeNextItem) {
        if (!context.localAliasMap.has(node.value)) {
          node.value = ":local(" + node.value + ")";
          context.localizeNextItem = false;
        }
      }
      break;

    case "function":
      if (
        context.options &&
        context.options.rewriteUrl &&
        node.value.toLowerCase() === "url"
      ) {
        node.nodes.map((nestedNode) => {
          if (nestedNode.type !== "string" && nestedNode.type !== "word") {
            return;
          }

          let newUrl = context.options.rewriteUrl(
            context.global,
            nestedNode.value
          );

          switch (nestedNode.type) {
            case "string":
              if (nestedNode.quote === "'") {
                newUrl = newUrl.replace(/(\\)/g, "\\$1").replace(/'/g, "\\'");
              }

              if (nestedNode.quote === '"') {
                newUrl = newUrl.replace(/(\\)/g, "\\$1").replace(/"/g, '\\"');
              }

              break;
            case "word":
              newUrl = newUrl.replace(/("|'|\)|\\)/g, "\\$1");
              break;
          }

          nestedNode.value = newUrl;
        });
      }
      break;
  }
  return node;
}

function isWordAFunctionArgument(wordNode, functionNode) {
  return functionNode
    ? functionNode.nodes.some(
        (functionNodeChild) =>
          functionNodeChild.sourceIndex === wordNode.sourceIndex
      )
    : false;
}

function localizeDeclarationValues(localize, declaration, context) {
  const valueNodes = valueParser(declaration.value);

  valueNodes.walk((node, index, nodes) => {
    const subContext = {
      options: context.options,
      global: context.global,
      localizeNextItem: localize && !context.global,
      localAliasMap: context.localAliasMap,
    };
    nodes[index] = localizeDeclNode(node, subContext);
  });

  declaration.value = valueNodes.toString();
}

function localizeDeclaration(declaration, context) {
  const isAnimation = /animation$/i.test(declaration.prop);

  if (isAnimation) {
    const validIdent = /^-?[_a-z][_a-z0-9-]*$/i;

    /*
    The spec defines some keywords that you can use to describe properties such as the timing
    function. These are still valid animation names, so as long as there is a property that accepts
    a keyword, it is given priority. Only when all the properties that can take a keyword are
    exhausted can the animation name be set to the keyword. I.e.
  
    animation: infinite infinite;
  
    The animation will repeat an infinite number of times from the first argument, and will have an
    animation name of infinite from the second.
    */
    const animationKeywords = {
      $alternate: 1,
      "$alternate-reverse": 1,
      $backwards: 1,
      $both: 1,
      $ease: 1,
      "$ease-in": 1,
      "$ease-in-out": 1,
      "$ease-out": 1,
      $forwards: 1,
      $infinite: 1,
      $linear: 1,
      $none: Infinity, // No matter how many times you write none, it will never be an animation name
      $normal: 1,
      $paused: 1,
      $reverse: 1,
      $running: 1,
      "$step-end": 1,
      "$step-start": 1,
      $initial: Infinity,
      $inherit: Infinity,
      $unset: Infinity,
    };

    const didParseAnimationName = false;
    let parsedAnimationKeywords = {};
    let stepsFunctionNode = null;
    const valueNodes = valueParser(declaration.value).walk((node) => {
      /* If div-token appeared (represents as comma ','), a possibility of an animation-keywords should be reflesh. */
      if (node.type === "div") {
        parsedAnimationKeywords = {};
      }
      if (node.type === "function" && node.value.toLowerCase() === "steps") {
        stepsFunctionNode = node;
      }
      const value =
        node.type === "word" &&
        !isWordAFunctionArgument(node, stepsFunctionNode)
          ? node.value.toLowerCase()
          : null;

      let shouldParseAnimationName = false;

      if (!didParseAnimationName && value && validIdent.test(value)) {
        if ("$" + value in animationKeywords) {
          parsedAnimationKeywords["$" + value] =
            "$" + value in parsedAnimationKeywords
              ? parsedAnimationKeywords["$" + value] + 1
              : 0;

          shouldParseAnimationName =
            parsedAnimationKeywords["$" + value] >=
            animationKeywords["$" + value];
        } else {
          shouldParseAnimationName = true;
        }
      }

      const subContext = {
        options: context.options,
        global: context.global,
        localizeNextItem: shouldParseAnimationName && !context.global,
        localAliasMap: context.localAliasMap,
      };
      return localizeDeclNode(node, subContext);
    });

    declaration.value = valueNodes.toString();

    return;
  }

  const isAnimationName = /animation(-name)?$/i.test(declaration.prop);

  if (isAnimationName) {
    return localizeDeclarationValues(true, declaration, context);
  }

  const hasUrl = /url\(/i.test(declaration.value);

  if (hasUrl) {
    return localizeDeclarationValues(false, declaration, context);
  }
}

module.exports = (options = {}) => {
  if (
    options &&
    options.mode &&
    options.mode !== "global" &&
    options.mode !== "local" &&
    options.mode !== "pure"
  ) {
    throw new Error(
      'options.mode must be either "global", "local" or "pure" (default "local")'
    );
  }

  const pureMode = options && options.mode === "pure";
  const globalMode = options && options.mode === "global";

  return {
    postcssPlugin: "postcss-modules-local-by-default",
    prepare() {
      const localAliasMap = new Map();

      return {
        Once(root) {
          const { icssImports } = extractICSS(root, false);

          Object.keys(icssImports).forEach((key) => {
            Object.keys(icssImports[key]).forEach((prop) => {
              localAliasMap.set(prop, icssImports[key][prop]);
            });
          });

          root.walkAtRules((atRule) => {
            if (/keyframes$/i.test(atRule.name)) {
              const globalMatch = /^\s*:global\s*\((.+)\)\s*$/.exec(
                atRule.params
              );
              const localMatch = /^\s*:local\s*\((.+)\)\s*$/.exec(
                atRule.params
              );

              let globalKeyframes = globalMode;

              if (globalMatch) {
                if (pureMode) {
                  throw atRule.error(
                    "@keyframes :global(...) is not allowed in pure mode"
                  );
                }
                atRule.params = globalMatch[1];
                globalKeyframes = true;
              } else if (localMatch) {
                atRule.params = localMatch[0];
                globalKeyframes = false;
              } else if (!globalMode) {
                if (atRule.params && !localAliasMap.has(atRule.params)) {
                  atRule.params = ":local(" + atRule.params + ")";
                }
              }

              atRule.walkDecls((declaration) => {
                localizeDeclaration(declaration, {
                  localAliasMap,
                  options: options,
                  global: globalKeyframes,
                });
              });
            } else if (atRule.nodes) {
              atRule.nodes.forEach((declaration) => {
                if (declaration.type === "decl") {
                  localizeDeclaration(declaration, {
                    localAliasMap,
                    options: options,
                    global: globalMode,
                  });
                }
              });
            }
          });

          root.walkRules((rule) => {
            if (
              rule.parent &&
              rule.parent.type === "atrule" &&
              /keyframes$/i.test(rule.parent.name)
            ) {
              // ignore keyframe rules
              return;
            }

            const context = localizeNode(rule, options.mode, localAliasMap);

            context.options = options;
            context.localAliasMap = localAliasMap;

            if (pureMode && context.hasPureGlobals) {
              throw rule.error(
                'Selector "' +
                  rule.selector +
                  '" is not pure ' +
                  "(pure selectors must contain at least one local class or id)"
              );
            }

            rule.selector = context.selector;

            // Less-syntax mixins parse as rules with no nodes
            if (rule.nodes) {
              rule.nodes.forEach((declaration) =>
                localizeDeclaration(declaration, context)
              );
            }
          });
        },
      };
    },
  };
};
module.exports.postcss = true;


/***/ }),

/***/ 7475:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


const selectorParser = __nccwpck_require__(2997);

const hasOwnProperty = Object.prototype.hasOwnProperty;

function getSingleLocalNamesForComposes(root) {
  return root.nodes.map((node) => {
    if (node.type !== "selector" || node.nodes.length !== 1) {
      throw new Error(
        `composition is only allowed when selector is single :local class name not in "${root}"`
      );
    }

    node = node.nodes[0];

    if (
      node.type !== "pseudo" ||
      node.value !== ":local" ||
      node.nodes.length !== 1
    ) {
      throw new Error(
        'composition is only allowed when selector is single :local class name not in "' +
          root +
          '", "' +
          node +
          '" is weird'
      );
    }

    node = node.first;

    if (node.type !== "selector" || node.length !== 1) {
      throw new Error(
        'composition is only allowed when selector is single :local class name not in "' +
          root +
          '", "' +
          node +
          '" is weird'
      );
    }

    node = node.first;

    if (node.type !== "class") {
      // 'id' is not possible, because you can't compose ids
      throw new Error(
        'composition is only allowed when selector is single :local class name not in "' +
          root +
          '", "' +
          node +
          '" is weird'
      );
    }

    return node.value;
  });
}

const whitespace = "[\\x20\\t\\r\\n\\f]";
const unescapeRegExp = new RegExp(
  "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)",
  "ig"
);

function unescape(str) {
  return str.replace(unescapeRegExp, (_, escaped, escapedWhitespace) => {
    const high = "0x" + escaped - 0x10000;

    // NaN means non-codepoint
    // Workaround erroneous numeric interpretation of +"0x"
    return high !== high || escapedWhitespace
      ? escaped
      : high < 0
      ? // BMP codepoint
        String.fromCharCode(high + 0x10000)
      : // Supplemental Plane codepoint (surrogate pair)
        String.fromCharCode((high >> 10) | 0xd800, (high & 0x3ff) | 0xdc00);
  });
}

const plugin = (options = {}) => {
  const generateScopedName =
    (options && options.generateScopedName) || plugin.generateScopedName;
  const generateExportEntry =
    (options && options.generateExportEntry) || plugin.generateExportEntry;
  const exportGlobals = options && options.exportGlobals;

  return {
    postcssPlugin: "postcss-modules-scope",
    Once(root, { rule }) {
      const exports = Object.create(null);

      function exportScopedName(name, rawName) {
        const scopedName = generateScopedName(
          rawName ? rawName : name,
          root.source.input.from,
          root.source.input.css
        );
        const exportEntry = generateExportEntry(
          rawName ? rawName : name,
          scopedName,
          root.source.input.from,
          root.source.input.css
        );
        const { key, value } = exportEntry;

        exports[key] = exports[key] || [];

        if (exports[key].indexOf(value) < 0) {
          exports[key].push(value);
        }

        return scopedName;
      }

      function localizeNode(node) {
        switch (node.type) {
          case "selector":
            node.nodes = node.map(localizeNode);
            return node;
          case "class":
            return selectorParser.className({
              value: exportScopedName(
                node.value,
                node.raws && node.raws.value ? node.raws.value : null
              ),
            });
          case "id": {
            return selectorParser.id({
              value: exportScopedName(
                node.value,
                node.raws && node.raws.value ? node.raws.value : null
              ),
            });
          }
        }

        throw new Error(
          `${node.type} ("${node}") is not allowed in a :local block`
        );
      }

      function traverseNode(node) {
        switch (node.type) {
          case "pseudo":
            if (node.value === ":local") {
              if (node.nodes.length !== 1) {
                throw new Error('Unexpected comma (",") in :local block');
              }

              const selector = localizeNode(node.first, node.spaces);
              // move the spaces that were around the psuedo selector to the first
              // non-container node
              selector.first.spaces = node.spaces;

              const nextNode = node.next();

              if (
                nextNode &&
                nextNode.type === "combinator" &&
                nextNode.value === " " &&
                /\\[A-F0-9]{1,6}$/.test(selector.last.value)
              ) {
                selector.last.spaces.after = " ";
              }

              node.replaceWith(selector);

              return;
            }
          /* falls through */
          case "root":
          case "selector": {
            node.each(traverseNode);
            break;
          }
          case "id":
          case "class":
            if (exportGlobals) {
              exports[node.value] = [node.value];
            }
            break;
        }
        return node;
      }

      // Find any :import and remember imported names
      const importedNames = {};

      root.walkRules(/^:import\(.+\)$/, (rule) => {
        rule.walkDecls((decl) => {
          importedNames[decl.prop] = true;
        });
      });

      // Find any :local selectors
      root.walkRules((rule) => {
        let parsedSelector = selectorParser().astSync(rule);

        rule.selector = traverseNode(parsedSelector.clone()).toString();

        rule.walkDecls(/composes|compose-with/i, (decl) => {
          const localNames = getSingleLocalNamesForComposes(parsedSelector);
          const classes = decl.value.split(/\s+/);

          classes.forEach((className) => {
            const global = /^global\(([^)]+)\)$/.exec(className);

            if (global) {
              localNames.forEach((exportedName) => {
                exports[exportedName].push(global[1]);
              });
            } else if (hasOwnProperty.call(importedNames, className)) {
              localNames.forEach((exportedName) => {
                exports[exportedName].push(className);
              });
            } else if (hasOwnProperty.call(exports, className)) {
              localNames.forEach((exportedName) => {
                exports[className].forEach((item) => {
                  exports[exportedName].push(item);
                });
              });
            } else {
              throw decl.error(
                `referenced class name "${className}" in ${decl.prop} not found`
              );
            }
          });

          decl.remove();
        });

        // Find any :local values
        rule.walkDecls((decl) => {
          if (!/:local\s*\((.+?)\)/.test(decl.value)) {
            return;
          }

          let tokens = decl.value.split(/(,|'[^']*'|"[^"]*")/);

          tokens = tokens.map((token, idx) => {
            if (idx === 0 || tokens[idx - 1] === ",") {
              let result = token;

              const localMatch = /:local\s*\((.+?)\)/.exec(token);

              if (localMatch) {
                const input = localMatch.input;
                const matchPattern = localMatch[0];
                const matchVal = localMatch[1];
                const newVal = exportScopedName(matchVal);

                result = input.replace(matchPattern, newVal);
              } else {
                return token;
              }

              return result;
            } else {
              return token;
            }
          });

          decl.value = tokens.join("");
        });
      });

      // Find any :local keyframes
      root.walkAtRules(/keyframes$/i, (atRule) => {
        const localMatch = /^\s*:local\s*\((.+?)\)\s*$/.exec(atRule.params);

        if (!localMatch) {
          return;
        }

        atRule.params = exportScopedName(localMatch[1]);
      });

      // If we found any :locals, insert an :export rule
      const exportedNames = Object.keys(exports);

      if (exportedNames.length > 0) {
        const exportRule = rule({ selector: ":export" });

        exportedNames.forEach((exportedName) =>
          exportRule.append({
            prop: exportedName,
            value: exports[exportedName].join(" "),
            raws: { before: "\n  " },
          })
        );

        root.append(exportRule);
      }
    },
  };
};

plugin.postcss = true;

plugin.generateScopedName = function (name, path) {
  const sanitisedPath = path
    .replace(/\.[^./\\]+$/, "")
    .replace(/[\W_]+/g, "_")
    .replace(/^_|_$/g, "");

  return `_${sanitisedPath}__${name}`.trim();
};

plugin.generateExportEntry = function (name, scopedName) {
  return {
    key: unescape(name),
    value: unescape(scopedName),
  };
};

module.exports = plugin;


/***/ }),

/***/ 4270:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


const ICSSUtils = __nccwpck_require__(4665);

const matchImports = /^(.+?|\([\s\S]+?\))\s+from\s+("[^"]*"|'[^']*'|[\w-]+)$/;
const matchValueDefinition = /(?:\s+|^)([\w-]+):?(.*?)$/;
const matchImport = /^([\w-]+)(?:\s+as\s+([\w-]+))?/;

module.exports = (options) => {
  let importIndex = 0;
  const createImportedName =
    (options && options.createImportedName) ||
    ((importName /*, path*/) =>
      `i__const_${importName.replace(/\W/g, "_")}_${importIndex++}`);

  return {
    postcssPlugin: "postcss-modules-values",
    prepare(result) {
      const importAliases = [];
      const definitions = {};

      return {
        Once(root, postcss) {
          root.walkAtRules(/value/i, (atRule) => {
            const matches = atRule.params.match(matchImports);

            if (matches) {
              let [, /*match*/ aliases, path] = matches;

              // We can use constants for path names
              if (definitions[path]) {
                path = definitions[path];
              }

              const imports = aliases
                .replace(/^\(\s*([\s\S]+)\s*\)$/, "$1")
                .split(/\s*,\s*/)
                .map((alias) => {
                  const tokens = matchImport.exec(alias);

                  if (tokens) {
                    const [, /*match*/ theirName, myName = theirName] = tokens;
                    const importedName = createImportedName(myName);
                    definitions[myName] = importedName;
                    return { theirName, importedName };
                  } else {
                    throw new Error(`@import statement "${alias}" is invalid!`);
                  }
                });

              importAliases.push({ path, imports });

              atRule.remove();

              return;
            }

            if (atRule.params.indexOf("@value") !== -1) {
              result.warn("Invalid value definition: " + atRule.params);
            }

            let [, key, value] = `${atRule.params}${atRule.raws.between}`.match(
              matchValueDefinition
            );

            const normalizedValue = value.replace(/\/\*((?!\*\/).*?)\*\//g, "");

            if (normalizedValue.length === 0) {
              result.warn("Invalid value definition: " + atRule.params);
              atRule.remove();

              return;
            }

            let isOnlySpace = /^\s+$/.test(normalizedValue);

            if (!isOnlySpace) {
              value = value.trim();
            }

            // Add to the definitions, knowing that values can refer to each other
            definitions[key] = ICSSUtils.replaceValueSymbols(
              value,
              definitions
            );

            atRule.remove();
          });

          /* If we have no definitions, don't continue */
          if (!Object.keys(definitions).length) {
            return;
          }

          /* Perform replacements */
          ICSSUtils.replaceSymbols(root, definitions);

          /* We want to export anything defined by now, but don't add it to the CSS yet or it well get picked up by the replacement stuff */
          const exportDeclarations = Object.keys(definitions).map((key) =>
            postcss.decl({
              value: definitions[key],
              prop: key,
              raws: { before: "\n  " },
            })
          );

          /* Add export rules if any */
          if (exportDeclarations.length > 0) {
            const exportRule = postcss.rule({
              selector: ":export",
              raws: { after: "\n" },
            });

            exportRule.append(exportDeclarations);

            root.prepend(exportRule);
          }

          /* Add import rules */
          importAliases.reverse().forEach(({ path, imports }) => {
            const importRule = postcss.rule({
              selector: `:import(${path})`,
              raws: { after: "\n" },
            });

            imports.forEach(({ theirName, importedName }) => {
              importRule.append({
                value: theirName,
                prop: importedName,
                raws: { before: "\n  " },
              });
            });

            root.prepend(importRule);
          });
        },
      };
    },
  };
};

module.exports.postcss = true;


/***/ }),

/***/ 2997:
/***/ ((module, exports, __nccwpck_require__) => {

"use strict";


exports.__esModule = true;
exports.default = void 0;

var _processor = _interopRequireDefault(__nccwpck_require__(390));

var selectors = _interopRequireWildcard(__nccwpck_require__(1483));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var parser = function parser(processor) {
  return new _processor["default"](processor);
};

Object.assign(parser, selectors);
delete parser.__esModule;
var _default = parser;
exports.default = _default;
module.exports = exports.default;

/***/ }),

/***/ 8526:
/***/ ((module, exports, __nccwpck_require__) => {

"use strict";


exports.__esModule = true;
exports.default = void 0;

var _root = _interopRequireDefault(__nccwpck_require__(4804));

var _selector = _interopRequireDefault(__nccwpck_require__(7370));

var _className = _interopRequireDefault(__nccwpck_require__(9780));

var _comment = _interopRequireDefault(__nccwpck_require__(974));

var _id = _interopRequireDefault(__nccwpck_require__(2050));

var _tag = _interopRequireDefault(__nccwpck_require__(9646));

var _string = _interopRequireDefault(__nccwpck_require__(2391));

var _pseudo = _interopRequireDefault(__nccwpck_require__(8681));

var _attribute = _interopRequireWildcard(__nccwpck_require__(326));

var _universal = _interopRequireDefault(__nccwpck_require__(4843));

var _combinator = _interopRequireDefault(__nccwpck_require__(8765));

var _nesting = _interopRequireDefault(__nccwpck_require__(9497));

var _sortAscending = _interopRequireDefault(__nccwpck_require__(8520));

var _tokenize = _interopRequireWildcard(__nccwpck_require__(3370));

var tokens = _interopRequireWildcard(__nccwpck_require__(6684));

var types = _interopRequireWildcard(__nccwpck_require__(6895));

var _util = __nccwpck_require__(3621);

var _WHITESPACE_TOKENS, _Object$assign;

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var WHITESPACE_TOKENS = (_WHITESPACE_TOKENS = {}, _WHITESPACE_TOKENS[tokens.space] = true, _WHITESPACE_TOKENS[tokens.cr] = true, _WHITESPACE_TOKENS[tokens.feed] = true, _WHITESPACE_TOKENS[tokens.newline] = true, _WHITESPACE_TOKENS[tokens.tab] = true, _WHITESPACE_TOKENS);
var WHITESPACE_EQUIV_TOKENS = Object.assign({}, WHITESPACE_TOKENS, (_Object$assign = {}, _Object$assign[tokens.comment] = true, _Object$assign));

function tokenStart(token) {
  return {
    line: token[_tokenize.FIELDS.START_LINE],
    column: token[_tokenize.FIELDS.START_COL]
  };
}

function tokenEnd(token) {
  return {
    line: token[_tokenize.FIELDS.END_LINE],
    column: token[_tokenize.FIELDS.END_COL]
  };
}

function getSource(startLine, startColumn, endLine, endColumn) {
  return {
    start: {
      line: startLine,
      column: startColumn
    },
    end: {
      line: endLine,
      column: endColumn
    }
  };
}

function getTokenSource(token) {
  return getSource(token[_tokenize.FIELDS.START_LINE], token[_tokenize.FIELDS.START_COL], token[_tokenize.FIELDS.END_LINE], token[_tokenize.FIELDS.END_COL]);
}

function getTokenSourceSpan(startToken, endToken) {
  if (!startToken) {
    return undefined;
  }

  return getSource(startToken[_tokenize.FIELDS.START_LINE], startToken[_tokenize.FIELDS.START_COL], endToken[_tokenize.FIELDS.END_LINE], endToken[_tokenize.FIELDS.END_COL]);
}

function unescapeProp(node, prop) {
  var value = node[prop];

  if (typeof value !== "string") {
    return;
  }

  if (value.indexOf("\\") !== -1) {
    (0, _util.ensureObject)(node, 'raws');
    node[prop] = (0, _util.unesc)(value);

    if (node.raws[prop] === undefined) {
      node.raws[prop] = value;
    }
  }

  return node;
}

function indexesOf(array, item) {
  var i = -1;
  var indexes = [];

  while ((i = array.indexOf(item, i + 1)) !== -1) {
    indexes.push(i);
  }

  return indexes;
}

function uniqs() {
  var list = Array.prototype.concat.apply([], arguments);
  return list.filter(function (item, i) {
    return i === list.indexOf(item);
  });
}

var Parser = /*#__PURE__*/function () {
  function Parser(rule, options) {
    if (options === void 0) {
      options = {};
    }

    this.rule = rule;
    this.options = Object.assign({
      lossy: false,
      safe: false
    }, options);
    this.position = 0;
    this.css = typeof this.rule === 'string' ? this.rule : this.rule.selector;
    this.tokens = (0, _tokenize["default"])({
      css: this.css,
      error: this._errorGenerator(),
      safe: this.options.safe
    });
    var rootSource = getTokenSourceSpan(this.tokens[0], this.tokens[this.tokens.length - 1]);
    this.root = new _root["default"]({
      source: rootSource
    });
    this.root.errorGenerator = this._errorGenerator();
    var selector = new _selector["default"]({
      source: {
        start: {
          line: 1,
          column: 1
        }
      }
    });
    this.root.append(selector);
    this.current = selector;
    this.loop();
  }

  var _proto = Parser.prototype;

  _proto._errorGenerator = function _errorGenerator() {
    var _this = this;

    return function (message, errorOptions) {
      if (typeof _this.rule === 'string') {
        return new Error(message);
      }

      return _this.rule.error(message, errorOptions);
    };
  };

  _proto.attribute = function attribute() {
    var attr = [];
    var startingToken = this.currToken;
    this.position++;

    while (this.position < this.tokens.length && this.currToken[_tokenize.FIELDS.TYPE] !== tokens.closeSquare) {
      attr.push(this.currToken);
      this.position++;
    }

    if (this.currToken[_tokenize.FIELDS.TYPE] !== tokens.closeSquare) {
      return this.expected('closing square bracket', this.currToken[_tokenize.FIELDS.START_POS]);
    }

    var len = attr.length;
    var node = {
      source: getSource(startingToken[1], startingToken[2], this.currToken[3], this.currToken[4]),
      sourceIndex: startingToken[_tokenize.FIELDS.START_POS]
    };

    if (len === 1 && !~[tokens.word].indexOf(attr[0][_tokenize.FIELDS.TYPE])) {
      return this.expected('attribute', attr[0][_tokenize.FIELDS.START_POS]);
    }

    var pos = 0;
    var spaceBefore = '';
    var commentBefore = '';
    var lastAdded = null;
    var spaceAfterMeaningfulToken = false;

    while (pos < len) {
      var token = attr[pos];
      var content = this.content(token);
      var next = attr[pos + 1];

      switch (token[_tokenize.FIELDS.TYPE]) {
        case tokens.space:
          // if (
          //     len === 1 ||
          //     pos === 0 && this.content(next) === '|'
          // ) {
          //     return this.expected('attribute', token[TOKEN.START_POS], content);
          // }
          spaceAfterMeaningfulToken = true;

          if (this.options.lossy) {
            break;
          }

          if (lastAdded) {
            (0, _util.ensureObject)(node, 'spaces', lastAdded);
            var prevContent = node.spaces[lastAdded].after || '';
            node.spaces[lastAdded].after = prevContent + content;
            var existingComment = (0, _util.getProp)(node, 'raws', 'spaces', lastAdded, 'after') || null;

            if (existingComment) {
              node.raws.spaces[lastAdded].after = existingComment + content;
            }
          } else {
            spaceBefore = spaceBefore + content;
            commentBefore = commentBefore + content;
          }

          break;

        case tokens.asterisk:
          if (next[_tokenize.FIELDS.TYPE] === tokens.equals) {
            node.operator = content;
            lastAdded = 'operator';
          } else if ((!node.namespace || lastAdded === "namespace" && !spaceAfterMeaningfulToken) && next) {
            if (spaceBefore) {
              (0, _util.ensureObject)(node, 'spaces', 'attribute');
              node.spaces.attribute.before = spaceBefore;
              spaceBefore = '';
            }

            if (commentBefore) {
              (0, _util.ensureObject)(node, 'raws', 'spaces', 'attribute');
              node.raws.spaces.attribute.before = spaceBefore;
              commentBefore = '';
            }

            node.namespace = (node.namespace || "") + content;
            var rawValue = (0, _util.getProp)(node, 'raws', 'namespace') || null;

            if (rawValue) {
              node.raws.namespace += content;
            }

            lastAdded = 'namespace';
          }

          spaceAfterMeaningfulToken = false;
          break;

        case tokens.dollar:
          if (lastAdded === "value") {
            var oldRawValue = (0, _util.getProp)(node, 'raws', 'value');
            node.value += "$";

            if (oldRawValue) {
              node.raws.value = oldRawValue + "$";
            }

            break;
          }

        // Falls through

        case tokens.caret:
          if (next[_tokenize.FIELDS.TYPE] === tokens.equals) {
            node.operator = content;
            lastAdded = 'operator';
          }

          spaceAfterMeaningfulToken = false;
          break;

        case tokens.combinator:
          if (content === '~' && next[_tokenize.FIELDS.TYPE] === tokens.equals) {
            node.operator = content;
            lastAdded = 'operator';
          }

          if (content !== '|') {
            spaceAfterMeaningfulToken = false;
            break;
          }

          if (next[_tokenize.FIELDS.TYPE] === tokens.equals) {
            node.operator = content;
            lastAdded = 'operator';
          } else if (!node.namespace && !node.attribute) {
            node.namespace = true;
          }

          spaceAfterMeaningfulToken = false;
          break;

        case tokens.word:
          if (next && this.content(next) === '|' && attr[pos + 2] && attr[pos + 2][_tokenize.FIELDS.TYPE] !== tokens.equals && // this look-ahead probably fails with comment nodes involved.
          !node.operator && !node.namespace) {
            node.namespace = content;
            lastAdded = 'namespace';
          } else if (!node.attribute || lastAdded === "attribute" && !spaceAfterMeaningfulToken) {
            if (spaceBefore) {
              (0, _util.ensureObject)(node, 'spaces', 'attribute');
              node.spaces.attribute.before = spaceBefore;
              spaceBefore = '';
            }

            if (commentBefore) {
              (0, _util.ensureObject)(node, 'raws', 'spaces', 'attribute');
              node.raws.spaces.attribute.before = commentBefore;
              commentBefore = '';
            }

            node.attribute = (node.attribute || "") + content;

            var _rawValue = (0, _util.getProp)(node, 'raws', 'attribute') || null;

            if (_rawValue) {
              node.raws.attribute += content;
            }

            lastAdded = 'attribute';
          } else if (!node.value && node.value !== "" || lastAdded === "value" && !spaceAfterMeaningfulToken) {
            var _unescaped = (0, _util.unesc)(content);

            var _oldRawValue = (0, _util.getProp)(node, 'raws', 'value') || '';

            var oldValue = node.value || '';
            node.value = oldValue + _unescaped;
            node.quoteMark = null;

            if (_unescaped !== content || _oldRawValue) {
              (0, _util.ensureObject)(node, 'raws');
              node.raws.value = (_oldRawValue || oldValue) + content;
            }

            lastAdded = 'value';
          } else {
            var insensitive = content === 'i' || content === "I";

            if ((node.value || node.value === '') && (node.quoteMark || spaceAfterMeaningfulToken)) {
              node.insensitive = insensitive;

              if (!insensitive || content === "I") {
                (0, _util.ensureObject)(node, 'raws');
                node.raws.insensitiveFlag = content;
              }

              lastAdded = 'insensitive';

              if (spaceBefore) {
                (0, _util.ensureObject)(node, 'spaces', 'insensitive');
                node.spaces.insensitive.before = spaceBefore;
                spaceBefore = '';
              }

              if (commentBefore) {
                (0, _util.ensureObject)(node, 'raws', 'spaces', 'insensitive');
                node.raws.spaces.insensitive.before = commentBefore;
                commentBefore = '';
              }
            } else if (node.value || node.value === '') {
              lastAdded = 'value';
              node.value += content;

              if (node.raws.value) {
                node.raws.value += content;
              }
            }
          }

          spaceAfterMeaningfulToken = false;
          break;

        case tokens.str:
          if (!node.attribute || !node.operator) {
            return this.error("Expected an attribute followed by an operator preceding the string.", {
              index: token[_tokenize.FIELDS.START_POS]
            });
          }

          var _unescapeValue = (0, _attribute.unescapeValue)(content),
              unescaped = _unescapeValue.unescaped,
              quoteMark = _unescapeValue.quoteMark;

          node.value = unescaped;
          node.quoteMark = quoteMark;
          lastAdded = 'value';
          (0, _util.ensureObject)(node, 'raws');
          node.raws.value = content;
          spaceAfterMeaningfulToken = false;
          break;

        case tokens.equals:
          if (!node.attribute) {
            return this.expected('attribute', token[_tokenize.FIELDS.START_POS], content);
          }

          if (node.value) {
            return this.error('Unexpected "=" found; an operator was already defined.', {
              index: token[_tokenize.FIELDS.START_POS]
            });
          }

          node.operator = node.operator ? node.operator + content : content;
          lastAdded = 'operator';
          spaceAfterMeaningfulToken = false;
          break;

        case tokens.comment:
          if (lastAdded) {
            if (spaceAfterMeaningfulToken || next && next[_tokenize.FIELDS.TYPE] === tokens.space || lastAdded === 'insensitive') {
              var lastComment = (0, _util.getProp)(node, 'spaces', lastAdded, 'after') || '';
              var rawLastComment = (0, _util.getProp)(node, 'raws', 'spaces', lastAdded, 'after') || lastComment;
              (0, _util.ensureObject)(node, 'raws', 'spaces', lastAdded);
              node.raws.spaces[lastAdded].after = rawLastComment + content;
            } else {
              var lastValue = node[lastAdded] || '';
              var rawLastValue = (0, _util.getProp)(node, 'raws', lastAdded) || lastValue;
              (0, _util.ensureObject)(node, 'raws');
              node.raws[lastAdded] = rawLastValue + content;
            }
          } else {
            commentBefore = commentBefore + content;
          }

          break;

        default:
          return this.error("Unexpected \"" + content + "\" found.", {
            index: token[_tokenize.FIELDS.START_POS]
          });
      }

      pos++;
    }

    unescapeProp(node, "attribute");
    unescapeProp(node, "namespace");
    this.newNode(new _attribute["default"](node));
    this.position++;
  }
  /**
   * return a node containing meaningless garbage up to (but not including) the specified token position.
   * if the token position is negative, all remaining tokens are consumed.
   *
   * This returns an array containing a single string node if all whitespace,
   * otherwise an array of comment nodes with space before and after.
   *
   * These tokens are not added to the current selector, the caller can add them or use them to amend
   * a previous node's space metadata.
   *
   * In lossy mode, this returns only comments.
   */
  ;

  _proto.parseWhitespaceEquivalentTokens = function parseWhitespaceEquivalentTokens(stopPosition) {
    if (stopPosition < 0) {
      stopPosition = this.tokens.length;
    }

    var startPosition = this.position;
    var nodes = [];
    var space = "";
    var lastComment = undefined;

    do {
      if (WHITESPACE_TOKENS[this.currToken[_tokenize.FIELDS.TYPE]]) {
        if (!this.options.lossy) {
          space += this.content();
        }
      } else if (this.currToken[_tokenize.FIELDS.TYPE] === tokens.comment) {
        var spaces = {};

        if (space) {
          spaces.before = space;
          space = "";
        }

        lastComment = new _comment["default"]({
          value: this.content(),
          source: getTokenSource(this.currToken),
          sourceIndex: this.currToken[_tokenize.FIELDS.START_POS],
          spaces: spaces
        });
        nodes.push(lastComment);
      }
    } while (++this.position < stopPosition);

    if (space) {
      if (lastComment) {
        lastComment.spaces.after = space;
      } else if (!this.options.lossy) {
        var firstToken = this.tokens[startPosition];
        var lastToken = this.tokens[this.position - 1];
        nodes.push(new _string["default"]({
          value: '',
          source: getSource(firstToken[_tokenize.FIELDS.START_LINE], firstToken[_tokenize.FIELDS.START_COL], lastToken[_tokenize.FIELDS.END_LINE], lastToken[_tokenize.FIELDS.END_COL]),
          sourceIndex: firstToken[_tokenize.FIELDS.START_POS],
          spaces: {
            before: space,
            after: ''
          }
        }));
      }
    }

    return nodes;
  }
  /**
   * 
   * @param {*} nodes 
   */
  ;

  _proto.convertWhitespaceNodesToSpace = function convertWhitespaceNodesToSpace(nodes, requiredSpace) {
    var _this2 = this;

    if (requiredSpace === void 0) {
      requiredSpace = false;
    }

    var space = "";
    var rawSpace = "";
    nodes.forEach(function (n) {
      var spaceBefore = _this2.lossySpace(n.spaces.before, requiredSpace);

      var rawSpaceBefore = _this2.lossySpace(n.rawSpaceBefore, requiredSpace);

      space += spaceBefore + _this2.lossySpace(n.spaces.after, requiredSpace && spaceBefore.length === 0);
      rawSpace += spaceBefore + n.value + _this2.lossySpace(n.rawSpaceAfter, requiredSpace && rawSpaceBefore.length === 0);
    });

    if (rawSpace === space) {
      rawSpace = undefined;
    }

    var result = {
      space: space,
      rawSpace: rawSpace
    };
    return result;
  };

  _proto.isNamedCombinator = function isNamedCombinator(position) {
    if (position === void 0) {
      position = this.position;
    }

    return this.tokens[position + 0] && this.tokens[position + 0][_tokenize.FIELDS.TYPE] === tokens.slash && this.tokens[position + 1] && this.tokens[position + 1][_tokenize.FIELDS.TYPE] === tokens.word && this.tokens[position + 2] && this.tokens[position + 2][_tokenize.FIELDS.TYPE] === tokens.slash;
  };

  _proto.namedCombinator = function namedCombinator() {
    if (this.isNamedCombinator()) {
      var nameRaw = this.content(this.tokens[this.position + 1]);
      var name = (0, _util.unesc)(nameRaw).toLowerCase();
      var raws = {};

      if (name !== nameRaw) {
        raws.value = "/" + nameRaw + "/";
      }

      var node = new _combinator["default"]({
        value: "/" + name + "/",
        source: getSource(this.currToken[_tokenize.FIELDS.START_LINE], this.currToken[_tokenize.FIELDS.START_COL], this.tokens[this.position + 2][_tokenize.FIELDS.END_LINE], this.tokens[this.position + 2][_tokenize.FIELDS.END_COL]),
        sourceIndex: this.currToken[_tokenize.FIELDS.START_POS],
        raws: raws
      });
      this.position = this.position + 3;
      return node;
    } else {
      this.unexpected();
    }
  };

  _proto.combinator = function combinator() {
    var _this3 = this;

    if (this.content() === '|') {
      return this.namespace();
    } // We need to decide between a space that's a descendant combinator and meaningless whitespace at the end of a selector.


    var nextSigTokenPos = this.locateNextMeaningfulToken(this.position);

    if (nextSigTokenPos < 0 || this.tokens[nextSigTokenPos][_tokenize.FIELDS.TYPE] === tokens.comma) {
      var nodes = this.parseWhitespaceEquivalentTokens(nextSigTokenPos);

      if (nodes.length > 0) {
        var last = this.current.last;

        if (last) {
          var _this$convertWhitespa = this.convertWhitespaceNodesToSpace(nodes),
              space = _this$convertWhitespa.space,
              rawSpace = _this$convertWhitespa.rawSpace;

          if (rawSpace !== undefined) {
            last.rawSpaceAfter += rawSpace;
          }

          last.spaces.after += space;
        } else {
          nodes.forEach(function (n) {
            return _this3.newNode(n);
          });
        }
      }

      return;
    }

    var firstToken = this.currToken;
    var spaceOrDescendantSelectorNodes = undefined;

    if (nextSigTokenPos > this.position) {
      spaceOrDescendantSelectorNodes = this.parseWhitespaceEquivalentTokens(nextSigTokenPos);
    }

    var node;

    if (this.isNamedCombinator()) {
      node = this.namedCombinator();
    } else if (this.currToken[_tokenize.FIELDS.TYPE] === tokens.combinator) {
      node = new _combinator["default"]({
        value: this.content(),
        source: getTokenSource(this.currToken),
        sourceIndex: this.currToken[_tokenize.FIELDS.START_POS]
      });
      this.position++;
    } else if (WHITESPACE_TOKENS[this.currToken[_tokenize.FIELDS.TYPE]]) {// pass
    } else if (!spaceOrDescendantSelectorNodes) {
      this.unexpected();
    }

    if (node) {
      if (spaceOrDescendantSelectorNodes) {
        var _this$convertWhitespa2 = this.convertWhitespaceNodesToSpace(spaceOrDescendantSelectorNodes),
            _space = _this$convertWhitespa2.space,
            _rawSpace = _this$convertWhitespa2.rawSpace;

        node.spaces.before = _space;
        node.rawSpaceBefore = _rawSpace;
      }
    } else {
      // descendant combinator
      var _this$convertWhitespa3 = this.convertWhitespaceNodesToSpace(spaceOrDescendantSelectorNodes, true),
          _space2 = _this$convertWhitespa3.space,
          _rawSpace2 = _this$convertWhitespa3.rawSpace;

      if (!_rawSpace2) {
        _rawSpace2 = _space2;
      }

      var spaces = {};
      var raws = {
        spaces: {}
      };

      if (_space2.endsWith(' ') && _rawSpace2.endsWith(' ')) {
        spaces.before = _space2.slice(0, _space2.length - 1);
        raws.spaces.before = _rawSpace2.slice(0, _rawSpace2.length - 1);
      } else if (_space2.startsWith(' ') && _rawSpace2.startsWith(' ')) {
        spaces.after = _space2.slice(1);
        raws.spaces.after = _rawSpace2.slice(1);
      } else {
        raws.value = _rawSpace2;
      }

      node = new _combinator["default"]({
        value: ' ',
        source: getTokenSourceSpan(firstToken, this.tokens[this.position - 1]),
        sourceIndex: firstToken[_tokenize.FIELDS.START_POS],
        spaces: spaces,
        raws: raws
      });
    }

    if (this.currToken && this.currToken[_tokenize.FIELDS.TYPE] === tokens.space) {
      node.spaces.after = this.optionalSpace(this.content());
      this.position++;
    }

    return this.newNode(node);
  };

  _proto.comma = function comma() {
    if (this.position === this.tokens.length - 1) {
      this.root.trailingComma = true;
      this.position++;
      return;
    }

    this.current._inferEndPosition();

    var selector = new _selector["default"]({
      source: {
        start: tokenStart(this.tokens[this.position + 1])
      }
    });
    this.current.parent.append(selector);
    this.current = selector;
    this.position++;
  };

  _proto.comment = function comment() {
    var current = this.currToken;
    this.newNode(new _comment["default"]({
      value: this.content(),
      source: getTokenSource(current),
      sourceIndex: current[_tokenize.FIELDS.START_POS]
    }));
    this.position++;
  };

  _proto.error = function error(message, opts) {
    throw this.root.error(message, opts);
  };

  _proto.missingBackslash = function missingBackslash() {
    return this.error('Expected a backslash preceding the semicolon.', {
      index: this.currToken[_tokenize.FIELDS.START_POS]
    });
  };

  _proto.missingParenthesis = function missingParenthesis() {
    return this.expected('opening parenthesis', this.currToken[_tokenize.FIELDS.START_POS]);
  };

  _proto.missingSquareBracket = function missingSquareBracket() {
    return this.expected('opening square bracket', this.currToken[_tokenize.FIELDS.START_POS]);
  };

  _proto.unexpected = function unexpected() {
    return this.error("Unexpected '" + this.content() + "'. Escaping special characters with \\ may help.", this.currToken[_tokenize.FIELDS.START_POS]);
  };

  _proto.namespace = function namespace() {
    var before = this.prevToken && this.content(this.prevToken) || true;

    if (this.nextToken[_tokenize.FIELDS.TYPE] === tokens.word) {
      this.position++;
      return this.word(before);
    } else if (this.nextToken[_tokenize.FIELDS.TYPE] === tokens.asterisk) {
      this.position++;
      return this.universal(before);
    }
  };

  _proto.nesting = function nesting() {
    if (this.nextToken) {
      var nextContent = this.content(this.nextToken);

      if (nextContent === "|") {
        this.position++;
        return;
      }
    }

    var current = this.currToken;
    this.newNode(new _nesting["default"]({
      value: this.content(),
      source: getTokenSource(current),
      sourceIndex: current[_tokenize.FIELDS.START_POS]
    }));
    this.position++;
  };

  _proto.parentheses = function parentheses() {
    var last = this.current.last;
    var unbalanced = 1;
    this.position++;

    if (last && last.type === types.PSEUDO) {
      var selector = new _selector["default"]({
        source: {
          start: tokenStart(this.tokens[this.position - 1])
        }
      });
      var cache = this.current;
      last.append(selector);
      this.current = selector;

      while (this.position < this.tokens.length && unbalanced) {
        if (this.currToken[_tokenize.FIELDS.TYPE] === tokens.openParenthesis) {
          unbalanced++;
        }

        if (this.currToken[_tokenize.FIELDS.TYPE] === tokens.closeParenthesis) {
          unbalanced--;
        }

        if (unbalanced) {
          this.parse();
        } else {
          this.current.source.end = tokenEnd(this.currToken);
          this.current.parent.source.end = tokenEnd(this.currToken);
          this.position++;
        }
      }

      this.current = cache;
    } else {
      // I think this case should be an error. It's used to implement a basic parse of media queries
      // but I don't think it's a good idea.
      var parenStart = this.currToken;
      var parenValue = "(";
      var parenEnd;

      while (this.position < this.tokens.length && unbalanced) {
        if (this.currToken[_tokenize.FIELDS.TYPE] === tokens.openParenthesis) {
          unbalanced++;
        }

        if (this.currToken[_tokenize.FIELDS.TYPE] === tokens.closeParenthesis) {
          unbalanced--;
        }

        parenEnd = this.currToken;
        parenValue += this.parseParenthesisToken(this.currToken);
        this.position++;
      }

      if (last) {
        last.appendToPropertyAndEscape("value", parenValue, parenValue);
      } else {
        this.newNode(new _string["default"]({
          value: parenValue,
          source: getSource(parenStart[_tokenize.FIELDS.START_LINE], parenStart[_tokenize.FIELDS.START_COL], parenEnd[_tokenize.FIELDS.END_LINE], parenEnd[_tokenize.FIELDS.END_COL]),
          sourceIndex: parenStart[_tokenize.FIELDS.START_POS]
        }));
      }
    }

    if (unbalanced) {
      return this.expected('closing parenthesis', this.currToken[_tokenize.FIELDS.START_POS]);
    }
  };

  _proto.pseudo = function pseudo() {
    var _this4 = this;

    var pseudoStr = '';
    var startingToken = this.currToken;

    while (this.currToken && this.currToken[_tokenize.FIELDS.TYPE] === tokens.colon) {
      pseudoStr += this.content();
      this.position++;
    }

    if (!this.currToken) {
      return this.expected(['pseudo-class', 'pseudo-element'], this.position - 1);
    }

    if (this.currToken[_tokenize.FIELDS.TYPE] === tokens.word) {
      this.splitWord(false, function (first, length) {
        pseudoStr += first;

        _this4.newNode(new _pseudo["default"]({
          value: pseudoStr,
          source: getTokenSourceSpan(startingToken, _this4.currToken),
          sourceIndex: startingToken[_tokenize.FIELDS.START_POS]
        }));

        if (length > 1 && _this4.nextToken && _this4.nextToken[_tokenize.FIELDS.TYPE] === tokens.openParenthesis) {
          _this4.error('Misplaced parenthesis.', {
            index: _this4.nextToken[_tokenize.FIELDS.START_POS]
          });
        }
      });
    } else {
      return this.expected(['pseudo-class', 'pseudo-element'], this.currToken[_tokenize.FIELDS.START_POS]);
    }
  };

  _proto.space = function space() {
    var content = this.content(); // Handle space before and after the selector

    if (this.position === 0 || this.prevToken[_tokenize.FIELDS.TYPE] === tokens.comma || this.prevToken[_tokenize.FIELDS.TYPE] === tokens.openParenthesis || this.current.nodes.every(function (node) {
      return node.type === 'comment';
    })) {
      this.spaces = this.optionalSpace(content);
      this.position++;
    } else if (this.position === this.tokens.length - 1 || this.nextToken[_tokenize.FIELDS.TYPE] === tokens.comma || this.nextToken[_tokenize.FIELDS.TYPE] === tokens.closeParenthesis) {
      this.current.last.spaces.after = this.optionalSpace(content);
      this.position++;
    } else {
      this.combinator();
    }
  };

  _proto.string = function string() {
    var current = this.currToken;
    this.newNode(new _string["default"]({
      value: this.content(),
      source: getTokenSource(current),
      sourceIndex: current[_tokenize.FIELDS.START_POS]
    }));
    this.position++;
  };

  _proto.universal = function universal(namespace) {
    var nextToken = this.nextToken;

    if (nextToken && this.content(nextToken) === '|') {
      this.position++;
      return this.namespace();
    }

    var current = this.currToken;
    this.newNode(new _universal["default"]({
      value: this.content(),
      source: getTokenSource(current),
      sourceIndex: current[_tokenize.FIELDS.START_POS]
    }), namespace);
    this.position++;
  };

  _proto.splitWord = function splitWord(namespace, firstCallback) {
    var _this5 = this;

    var nextToken = this.nextToken;
    var word = this.content();

    while (nextToken && ~[tokens.dollar, tokens.caret, tokens.equals, tokens.word].indexOf(nextToken[_tokenize.FIELDS.TYPE])) {
      this.position++;
      var current = this.content();
      word += current;

      if (current.lastIndexOf('\\') === current.length - 1) {
        var next = this.nextToken;

        if (next && next[_tokenize.FIELDS.TYPE] === tokens.space) {
          word += this.requiredSpace(this.content(next));
          this.position++;
        }
      }

      nextToken = this.nextToken;
    }

    var hasClass = indexesOf(word, '.').filter(function (i) {
      return word[i - 1] !== '\\';
    });
    var hasId = indexesOf(word, '#').filter(function (i) {
      return word[i - 1] !== '\\';
    }); // Eliminate Sass interpolations from the list of id indexes

    var interpolations = indexesOf(word, '#{');

    if (interpolations.length) {
      hasId = hasId.filter(function (hashIndex) {
        return !~interpolations.indexOf(hashIndex);
      });
    }

    var indices = (0, _sortAscending["default"])(uniqs([0].concat(hasClass, hasId)));
    indices.forEach(function (ind, i) {
      var index = indices[i + 1] || word.length;
      var value = word.slice(ind, index);

      if (i === 0 && firstCallback) {
        return firstCallback.call(_this5, value, indices.length);
      }

      var node;
      var current = _this5.currToken;
      var sourceIndex = current[_tokenize.FIELDS.START_POS] + indices[i];
      var source = getSource(current[1], current[2] + ind, current[3], current[2] + (index - 1));

      if (~hasClass.indexOf(ind)) {
        var classNameOpts = {
          value: value.slice(1),
          source: source,
          sourceIndex: sourceIndex
        };
        node = new _className["default"](unescapeProp(classNameOpts, "value"));
      } else if (~hasId.indexOf(ind)) {
        var idOpts = {
          value: value.slice(1),
          source: source,
          sourceIndex: sourceIndex
        };
        node = new _id["default"](unescapeProp(idOpts, "value"));
      } else {
        var tagOpts = {
          value: value,
          source: source,
          sourceIndex: sourceIndex
        };
        unescapeProp(tagOpts, "value");
        node = new _tag["default"](tagOpts);
      }

      _this5.newNode(node, namespace); // Ensure that the namespace is used only once


      namespace = null;
    });
    this.position++;
  };

  _proto.word = function word(namespace) {
    var nextToken = this.nextToken;

    if (nextToken && this.content(nextToken) === '|') {
      this.position++;
      return this.namespace();
    }

    return this.splitWord(namespace);
  };

  _proto.loop = function loop() {
    while (this.position < this.tokens.length) {
      this.parse(true);
    }

    this.current._inferEndPosition();

    return this.root;
  };

  _proto.parse = function parse(throwOnParenthesis) {
    switch (this.currToken[_tokenize.FIELDS.TYPE]) {
      case tokens.space:
        this.space();
        break;

      case tokens.comment:
        this.comment();
        break;

      case tokens.openParenthesis:
        this.parentheses();
        break;

      case tokens.closeParenthesis:
        if (throwOnParenthesis) {
          this.missingParenthesis();
        }

        break;

      case tokens.openSquare:
        this.attribute();
        break;

      case tokens.dollar:
      case tokens.caret:
      case tokens.equals:
      case tokens.word:
        this.word();
        break;

      case tokens.colon:
        this.pseudo();
        break;

      case tokens.comma:
        this.comma();
        break;

      case tokens.asterisk:
        this.universal();
        break;

      case tokens.ampersand:
        this.nesting();
        break;

      case tokens.slash:
      case tokens.combinator:
        this.combinator();
        break;

      case tokens.str:
        this.string();
        break;
      // These cases throw; no break needed.

      case tokens.closeSquare:
        this.missingSquareBracket();

      case tokens.semicolon:
        this.missingBackslash();

      default:
        this.unexpected();
    }
  }
  /**
   * Helpers
   */
  ;

  _proto.expected = function expected(description, index, found) {
    if (Array.isArray(description)) {
      var last = description.pop();
      description = description.join(', ') + " or " + last;
    }

    var an = /^[aeiou]/.test(description[0]) ? 'an' : 'a';

    if (!found) {
      return this.error("Expected " + an + " " + description + ".", {
        index: index
      });
    }

    return this.error("Expected " + an + " " + description + ", found \"" + found + "\" instead.", {
      index: index
    });
  };

  _proto.requiredSpace = function requiredSpace(space) {
    return this.options.lossy ? ' ' : space;
  };

  _proto.optionalSpace = function optionalSpace(space) {
    return this.options.lossy ? '' : space;
  };

  _proto.lossySpace = function lossySpace(space, required) {
    if (this.options.lossy) {
      return required ? ' ' : '';
    } else {
      return space;
    }
  };

  _proto.parseParenthesisToken = function parseParenthesisToken(token) {
    var content = this.content(token);

    if (token[_tokenize.FIELDS.TYPE] === tokens.space) {
      return this.requiredSpace(content);
    } else {
      return content;
    }
  };

  _proto.newNode = function newNode(node, namespace) {
    if (namespace) {
      if (/^ +$/.test(namespace)) {
        if (!this.options.lossy) {
          this.spaces = (this.spaces || '') + namespace;
        }

        namespace = true;
      }

      node.namespace = namespace;
      unescapeProp(node, "namespace");
    }

    if (this.spaces) {
      node.spaces.before = this.spaces;
      this.spaces = '';
    }

    return this.current.append(node);
  };

  _proto.content = function content(token) {
    if (token === void 0) {
      token = this.currToken;
    }

    return this.css.slice(token[_tokenize.FIELDS.START_POS], token[_tokenize.FIELDS.END_POS]);
  };

  /**
   * returns the index of the next non-whitespace, non-comment token.
   * returns -1 if no meaningful token is found.
   */
  _proto.locateNextMeaningfulToken = function locateNextMeaningfulToken(startPosition) {
    if (startPosition === void 0) {
      startPosition = this.position + 1;
    }

    var searchPosition = startPosition;

    while (searchPosition < this.tokens.length) {
      if (WHITESPACE_EQUIV_TOKENS[this.tokens[searchPosition][_tokenize.FIELDS.TYPE]]) {
        searchPosition++;
        continue;
      } else {
        return searchPosition;
      }
    }

    return -1;
  };

  _createClass(Parser, [{
    key: "currToken",
    get: function get() {
      return this.tokens[this.position];
    }
  }, {
    key: "nextToken",
    get: function get() {
      return this.tokens[this.position + 1];
    }
  }, {
    key: "prevToken",
    get: function get() {
      return this.tokens[this.position - 1];
    }
  }]);

  return Parser;
}();

exports.default = Parser;
module.exports = exports.default;

/***/ }),

/***/ 390:
/***/ ((module, exports, __nccwpck_require__) => {

"use strict";


exports.__esModule = true;
exports.default = void 0;

var _parser = _interopRequireDefault(__nccwpck_require__(8526));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var Processor = /*#__PURE__*/function () {
  function Processor(func, options) {
    this.func = func || function noop() {};

    this.funcRes = null;
    this.options = options;
  }

  var _proto = Processor.prototype;

  _proto._shouldUpdateSelector = function _shouldUpdateSelector(rule, options) {
    if (options === void 0) {
      options = {};
    }

    var merged = Object.assign({}, this.options, options);

    if (merged.updateSelector === false) {
      return false;
    } else {
      return typeof rule !== "string";
    }
  };

  _proto._isLossy = function _isLossy(options) {
    if (options === void 0) {
      options = {};
    }

    var merged = Object.assign({}, this.options, options);

    if (merged.lossless === false) {
      return true;
    } else {
      return false;
    }
  };

  _proto._root = function _root(rule, options) {
    if (options === void 0) {
      options = {};
    }

    var parser = new _parser["default"](rule, this._parseOptions(options));
    return parser.root;
  };

  _proto._parseOptions = function _parseOptions(options) {
    return {
      lossy: this._isLossy(options)
    };
  };

  _proto._run = function _run(rule, options) {
    var _this = this;

    if (options === void 0) {
      options = {};
    }

    return new Promise(function (resolve, reject) {
      try {
        var root = _this._root(rule, options);

        Promise.resolve(_this.func(root)).then(function (transform) {
          var string = undefined;

          if (_this._shouldUpdateSelector(rule, options)) {
            string = root.toString();
            rule.selector = string;
          }

          return {
            transform: transform,
            root: root,
            string: string
          };
        }).then(resolve, reject);
      } catch (e) {
        reject(e);
        return;
      }
    });
  };

  _proto._runSync = function _runSync(rule, options) {
    if (options === void 0) {
      options = {};
    }

    var root = this._root(rule, options);

    var transform = this.func(root);

    if (transform && typeof transform.then === "function") {
      throw new Error("Selector processor returned a promise to a synchronous call.");
    }

    var string = undefined;

    if (options.updateSelector && typeof rule !== "string") {
      string = root.toString();
      rule.selector = string;
    }

    return {
      transform: transform,
      root: root,
      string: string
    };
  }
  /**
   * Process rule into a selector AST.
   *
   * @param rule {postcss.Rule | string} The css selector to be processed
   * @param options The options for processing
   * @returns {Promise<parser.Root>} The AST of the selector after processing it.
   */
  ;

  _proto.ast = function ast(rule, options) {
    return this._run(rule, options).then(function (result) {
      return result.root;
    });
  }
  /**
   * Process rule into a selector AST synchronously.
   *
   * @param rule {postcss.Rule | string} The css selector to be processed
   * @param options The options for processing
   * @returns {parser.Root} The AST of the selector after processing it.
   */
  ;

  _proto.astSync = function astSync(rule, options) {
    return this._runSync(rule, options).root;
  }
  /**
   * Process a selector into a transformed value asynchronously
   *
   * @param rule {postcss.Rule | string} The css selector to be processed
   * @param options The options for processing
   * @returns {Promise<any>} The value returned by the processor.
   */
  ;

  _proto.transform = function transform(rule, options) {
    return this._run(rule, options).then(function (result) {
      return result.transform;
    });
  }
  /**
   * Process a selector into a transformed value synchronously.
   *
   * @param rule {postcss.Rule | string} The css selector to be processed
   * @param options The options for processing
   * @returns {any} The value returned by the processor.
   */
  ;

  _proto.transformSync = function transformSync(rule, options) {
    return this._runSync(rule, options).transform;
  }
  /**
   * Process a selector into a new selector string asynchronously.
   *
   * @param rule {postcss.Rule | string} The css selector to be processed
   * @param options The options for processing
   * @returns {string} the selector after processing.
   */
  ;

  _proto.process = function process(rule, options) {
    return this._run(rule, options).then(function (result) {
      return result.string || result.root.toString();
    });
  }
  /**
   * Process a selector into a new selector string synchronously.
   *
   * @param rule {postcss.Rule | string} The css selector to be processed
   * @param options The options for processing
   * @returns {string} the selector after processing.
   */
  ;

  _proto.processSync = function processSync(rule, options) {
    var result = this._runSync(rule, options);

    return result.string || result.root.toString();
  };

  return Processor;
}();

exports.default = Processor;
module.exports = exports.default;

/***/ }),

/***/ 326:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";


exports.__esModule = true;
exports.unescapeValue = unescapeValue;
exports.default = void 0;

var _cssesc = _interopRequireDefault(__nccwpck_require__(3120));

var _unesc = _interopRequireDefault(__nccwpck_require__(2897));

var _namespace = _interopRequireDefault(__nccwpck_require__(5669));

var _types = __nccwpck_require__(6895);

var _CSSESC_QUOTE_OPTIONS;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var deprecate = __nccwpck_require__(5278);

var WRAPPED_IN_QUOTES = /^('|")([^]*)\1$/;
var warnOfDeprecatedValueAssignment = deprecate(function () {}, "Assigning an attribute a value containing characters that might need to be escaped is deprecated. " + "Call attribute.setValue() instead.");
var warnOfDeprecatedQuotedAssignment = deprecate(function () {}, "Assigning attr.quoted is deprecated and has no effect. Assign to attr.quoteMark instead.");
var warnOfDeprecatedConstructor = deprecate(function () {}, "Constructing an Attribute selector with a value without specifying quoteMark is deprecated. Note: The value should be unescaped now.");

function unescapeValue(value) {
  var deprecatedUsage = false;
  var quoteMark = null;
  var unescaped = value;
  var m = unescaped.match(WRAPPED_IN_QUOTES);

  if (m) {
    quoteMark = m[1];
    unescaped = m[2];
  }

  unescaped = (0, _unesc["default"])(unescaped);

  if (unescaped !== value) {
    deprecatedUsage = true;
  }

  return {
    deprecatedUsage: deprecatedUsage,
    unescaped: unescaped,
    quoteMark: quoteMark
  };
}

function handleDeprecatedContructorOpts(opts) {
  if (opts.quoteMark !== undefined) {
    return opts;
  }

  if (opts.value === undefined) {
    return opts;
  }

  warnOfDeprecatedConstructor();

  var _unescapeValue = unescapeValue(opts.value),
      quoteMark = _unescapeValue.quoteMark,
      unescaped = _unescapeValue.unescaped;

  if (!opts.raws) {
    opts.raws = {};
  }

  if (opts.raws.value === undefined) {
    opts.raws.value = opts.value;
  }

  opts.value = unescaped;
  opts.quoteMark = quoteMark;
  return opts;
}

var Attribute = /*#__PURE__*/function (_Namespace) {
  _inheritsLoose(Attribute, _Namespace);

  function Attribute(opts) {
    var _this;

    if (opts === void 0) {
      opts = {};
    }

    _this = _Namespace.call(this, handleDeprecatedContructorOpts(opts)) || this;
    _this.type = _types.ATTRIBUTE;
    _this.raws = _this.raws || {};
    Object.defineProperty(_this.raws, 'unquoted', {
      get: deprecate(function () {
        return _this.value;
      }, "attr.raws.unquoted is deprecated. Call attr.value instead."),
      set: deprecate(function () {
        return _this.value;
      }, "Setting attr.raws.unquoted is deprecated and has no effect. attr.value is unescaped by default now.")
    });
    _this._constructed = true;
    return _this;
  }
  /**
   * Returns the Attribute's value quoted such that it would be legal to use
   * in the value of a css file. The original value's quotation setting
   * used for stringification is left unchanged. See `setValue(value, options)`
   * if you want to control the quote settings of a new value for the attribute.
   *
   * You can also change the quotation used for the current value by setting quoteMark.
   *
   * Options:
   *   * quoteMark {'"' | "'" | null} - Use this value to quote the value. If this
   *     option is not set, the original value for quoteMark will be used. If
   *     indeterminate, a double quote is used. The legal values are:
   *     * `null` - the value will be unquoted and characters will be escaped as necessary.
   *     * `'` - the value will be quoted with a single quote and single quotes are escaped.
   *     * `"` - the value will be quoted with a double quote and double quotes are escaped.
   *   * preferCurrentQuoteMark {boolean} - if true, prefer the source quote mark
   *     over the quoteMark option value.
   *   * smart {boolean} - if true, will select a quote mark based on the value
   *     and the other options specified here. See the `smartQuoteMark()`
   *     method.
   **/


  var _proto = Attribute.prototype;

  _proto.getQuotedValue = function getQuotedValue(options) {
    if (options === void 0) {
      options = {};
    }

    var quoteMark = this._determineQuoteMark(options);

    var cssescopts = CSSESC_QUOTE_OPTIONS[quoteMark];
    var escaped = (0, _cssesc["default"])(this._value, cssescopts);
    return escaped;
  };

  _proto._determineQuoteMark = function _determineQuoteMark(options) {
    return options.smart ? this.smartQuoteMark(options) : this.preferredQuoteMark(options);
  }
  /**
   * Set the unescaped value with the specified quotation options. The value
   * provided must not include any wrapping quote marks -- those quotes will
   * be interpreted as part of the value and escaped accordingly.
   */
  ;

  _proto.setValue = function setValue(value, options) {
    if (options === void 0) {
      options = {};
    }

    this._value = value;
    this._quoteMark = this._determineQuoteMark(options);

    this._syncRawValue();
  }
  /**
   * Intelligently select a quoteMark value based on the value's contents. If
   * the value is a legal CSS ident, it will not be quoted. Otherwise a quote
   * mark will be picked that minimizes the number of escapes.
   *
   * If there's no clear winner, the quote mark from these options is used,
   * then the source quote mark (this is inverted if `preferCurrentQuoteMark` is
   * true). If the quoteMark is unspecified, a double quote is used.
   *
   * @param options This takes the quoteMark and preferCurrentQuoteMark options
   * from the quoteValue method.
   */
  ;

  _proto.smartQuoteMark = function smartQuoteMark(options) {
    var v = this.value;
    var numSingleQuotes = v.replace(/[^']/g, '').length;
    var numDoubleQuotes = v.replace(/[^"]/g, '').length;

    if (numSingleQuotes + numDoubleQuotes === 0) {
      var escaped = (0, _cssesc["default"])(v, {
        isIdentifier: true
      });

      if (escaped === v) {
        return Attribute.NO_QUOTE;
      } else {
        var pref = this.preferredQuoteMark(options);

        if (pref === Attribute.NO_QUOTE) {
          // pick a quote mark that isn't none and see if it's smaller
          var quote = this.quoteMark || options.quoteMark || Attribute.DOUBLE_QUOTE;
          var opts = CSSESC_QUOTE_OPTIONS[quote];
          var quoteValue = (0, _cssesc["default"])(v, opts);

          if (quoteValue.length < escaped.length) {
            return quote;
          }
        }

        return pref;
      }
    } else if (numDoubleQuotes === numSingleQuotes) {
      return this.preferredQuoteMark(options);
    } else if (numDoubleQuotes < numSingleQuotes) {
      return Attribute.DOUBLE_QUOTE;
    } else {
      return Attribute.SINGLE_QUOTE;
    }
  }
  /**
   * Selects the preferred quote mark based on the options and the current quote mark value.
   * If you want the quote mark to depend on the attribute value, call `smartQuoteMark(opts)`
   * instead.
   */
  ;

  _proto.preferredQuoteMark = function preferredQuoteMark(options) {
    var quoteMark = options.preferCurrentQuoteMark ? this.quoteMark : options.quoteMark;

    if (quoteMark === undefined) {
      quoteMark = options.preferCurrentQuoteMark ? options.quoteMark : this.quoteMark;
    }

    if (quoteMark === undefined) {
      quoteMark = Attribute.DOUBLE_QUOTE;
    }

    return quoteMark;
  };

  _proto._syncRawValue = function _syncRawValue() {
    var rawValue = (0, _cssesc["default"])(this._value, CSSESC_QUOTE_OPTIONS[this.quoteMark]);

    if (rawValue === this._value) {
      if (this.raws) {
        delete this.raws.value;
      }
    } else {
      this.raws.value = rawValue;
    }
  };

  _proto._handleEscapes = function _handleEscapes(prop, value) {
    if (this._constructed) {
      var escaped = (0, _cssesc["default"])(value, {
        isIdentifier: true
      });

      if (escaped !== value) {
        this.raws[prop] = escaped;
      } else {
        delete this.raws[prop];
      }
    }
  };

  _proto._spacesFor = function _spacesFor(name) {
    var attrSpaces = {
      before: '',
      after: ''
    };
    var spaces = this.spaces[name] || {};
    var rawSpaces = this.raws.spaces && this.raws.spaces[name] || {};
    return Object.assign(attrSpaces, spaces, rawSpaces);
  };

  _proto._stringFor = function _stringFor(name, spaceName, concat) {
    if (spaceName === void 0) {
      spaceName = name;
    }

    if (concat === void 0) {
      concat = defaultAttrConcat;
    }

    var attrSpaces = this._spacesFor(spaceName);

    return concat(this.stringifyProperty(name), attrSpaces);
  }
  /**
   * returns the offset of the attribute part specified relative to the
   * start of the node of the output string.
   *
   * * "ns" - alias for "namespace"
   * * "namespace" - the namespace if it exists.
   * * "attribute" - the attribute name
   * * "attributeNS" - the start of the attribute or its namespace
   * * "operator" - the match operator of the attribute
   * * "value" - The value (string or identifier)
   * * "insensitive" - the case insensitivity flag;
   * @param part One of the possible values inside an attribute.
   * @returns -1 if the name is invalid or the value doesn't exist in this attribute.
   */
  ;

  _proto.offsetOf = function offsetOf(name) {
    var count = 1;

    var attributeSpaces = this._spacesFor("attribute");

    count += attributeSpaces.before.length;

    if (name === "namespace" || name === "ns") {
      return this.namespace ? count : -1;
    }

    if (name === "attributeNS") {
      return count;
    }

    count += this.namespaceString.length;

    if (this.namespace) {
      count += 1;
    }

    if (name === "attribute") {
      return count;
    }

    count += this.stringifyProperty("attribute").length;
    count += attributeSpaces.after.length;

    var operatorSpaces = this._spacesFor("operator");

    count += operatorSpaces.before.length;
    var operator = this.stringifyProperty("operator");

    if (name === "operator") {
      return operator ? count : -1;
    }

    count += operator.length;
    count += operatorSpaces.after.length;

    var valueSpaces = this._spacesFor("value");

    count += valueSpaces.before.length;
    var value = this.stringifyProperty("value");

    if (name === "value") {
      return value ? count : -1;
    }

    count += value.length;
    count += valueSpaces.after.length;

    var insensitiveSpaces = this._spacesFor("insensitive");

    count += insensitiveSpaces.before.length;

    if (name === "insensitive") {
      return this.insensitive ? count : -1;
    }

    return -1;
  };

  _proto.toString = function toString() {
    var _this2 = this;

    var selector = [this.rawSpaceBefore, '['];
    selector.push(this._stringFor('qualifiedAttribute', 'attribute'));

    if (this.operator && (this.value || this.value === '')) {
      selector.push(this._stringFor('operator'));
      selector.push(this._stringFor('value'));
      selector.push(this._stringFor('insensitiveFlag', 'insensitive', function (attrValue, attrSpaces) {
        if (attrValue.length > 0 && !_this2.quoted && attrSpaces.before.length === 0 && !(_this2.spaces.value && _this2.spaces.value.after)) {
          attrSpaces.before = " ";
        }

        return defaultAttrConcat(attrValue, attrSpaces);
      }));
    }

    selector.push(']');
    selector.push(this.rawSpaceAfter);
    return selector.join('');
  };

  _createClass(Attribute, [{
    key: "quoted",
    get: function get() {
      var qm = this.quoteMark;
      return qm === "'" || qm === '"';
    },
    set: function set(value) {
      warnOfDeprecatedQuotedAssignment();
    }
    /**
     * returns a single (`'`) or double (`"`) quote character if the value is quoted.
     * returns `null` if the value is not quoted.
     * returns `undefined` if the quotation state is unknown (this can happen when
     * the attribute is constructed without specifying a quote mark.)
     */

  }, {
    key: "quoteMark",
    get: function get() {
      return this._quoteMark;
    }
    /**
     * Set the quote mark to be used by this attribute's value.
     * If the quote mark changes, the raw (escaped) value at `attr.raws.value` of the attribute
     * value is updated accordingly.
     *
     * @param {"'" | '"' | null} quoteMark The quote mark or `null` if the value should be unquoted.
     */
    ,
    set: function set(quoteMark) {
      if (!this._constructed) {
        this._quoteMark = quoteMark;
        return;
      }

      if (this._quoteMark !== quoteMark) {
        this._quoteMark = quoteMark;

        this._syncRawValue();
      }
    }
  }, {
    key: "qualifiedAttribute",
    get: function get() {
      return this.qualifiedName(this.raws.attribute || this.attribute);
    }
  }, {
    key: "insensitiveFlag",
    get: function get() {
      return this.insensitive ? 'i' : '';
    }
  }, {
    key: "value",
    get: function get() {
      return this._value;
    }
    /**
     * Before 3.0, the value had to be set to an escaped value including any wrapped
     * quote marks. In 3.0, the semantics of `Attribute.value` changed so that the value
     * is unescaped during parsing and any quote marks are removed.
     *
     * Because the ambiguity of this semantic change, if you set `attr.value = newValue`,
     * a deprecation warning is raised when the new value contains any characters that would
     * require escaping (including if it contains wrapped quotes).
     *
     * Instead, you should call `attr.setValue(newValue, opts)` and pass options that describe
     * how the new value is quoted.
     */
    ,
    set: function set(v) {
      if (this._constructed) {
        var _unescapeValue2 = unescapeValue(v),
            deprecatedUsage = _unescapeValue2.deprecatedUsage,
            unescaped = _unescapeValue2.unescaped,
            quoteMark = _unescapeValue2.quoteMark;

        if (deprecatedUsage) {
          warnOfDeprecatedValueAssignment();
        }

        if (unescaped === this._value && quoteMark === this._quoteMark) {
          return;
        }

        this._value = unescaped;
        this._quoteMark = quoteMark;

        this._syncRawValue();
      } else {
        this._value = v;
      }
    }
  }, {
    key: "attribute",
    get: function get() {
      return this._attribute;
    },
    set: function set(name) {
      this._handleEscapes("attribute", name);

      this._attribute = name;
    }
  }]);

  return Attribute;
}(_namespace["default"]);

exports.default = Attribute;
Attribute.NO_QUOTE = null;
Attribute.SINGLE_QUOTE = "'";
Attribute.DOUBLE_QUOTE = '"';
var CSSESC_QUOTE_OPTIONS = (_CSSESC_QUOTE_OPTIONS = {
  "'": {
    quotes: 'single',
    wrap: true
  },
  '"': {
    quotes: 'double',
    wrap: true
  }
}, _CSSESC_QUOTE_OPTIONS[null] = {
  isIdentifier: true
}, _CSSESC_QUOTE_OPTIONS);

function defaultAttrConcat(attrValue, attrSpaces) {
  return "" + attrSpaces.before + attrValue + attrSpaces.after;
}

/***/ }),

/***/ 9780:
/***/ ((module, exports, __nccwpck_require__) => {

"use strict";


exports.__esModule = true;
exports.default = void 0;

var _cssesc = _interopRequireDefault(__nccwpck_require__(3120));

var _util = __nccwpck_require__(3621);

var _node = _interopRequireDefault(__nccwpck_require__(3206));

var _types = __nccwpck_require__(6895);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var ClassName = /*#__PURE__*/function (_Node) {
  _inheritsLoose(ClassName, _Node);

  function ClassName(opts) {
    var _this;

    _this = _Node.call(this, opts) || this;
    _this.type = _types.CLASS;
    _this._constructed = true;
    return _this;
  }

  var _proto = ClassName.prototype;

  _proto.valueToString = function valueToString() {
    return '.' + _Node.prototype.valueToString.call(this);
  };

  _createClass(ClassName, [{
    key: "value",
    get: function get() {
      return this._value;
    },
    set: function set(v) {
      if (this._constructed) {
        var escaped = (0, _cssesc["default"])(v, {
          isIdentifier: true
        });

        if (escaped !== v) {
          (0, _util.ensureObject)(this, "raws");
          this.raws.value = escaped;
        } else if (this.raws) {
          delete this.raws.value;
        }
      }

      this._value = v;
    }
  }]);

  return ClassName;
}(_node["default"]);

exports.default = ClassName;
module.exports = exports.default;

/***/ }),

/***/ 8765:
/***/ ((module, exports, __nccwpck_require__) => {

"use strict";


exports.__esModule = true;
exports.default = void 0;

var _node = _interopRequireDefault(__nccwpck_require__(3206));

var _types = __nccwpck_require__(6895);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var Combinator = /*#__PURE__*/function (_Node) {
  _inheritsLoose(Combinator, _Node);

  function Combinator(opts) {
    var _this;

    _this = _Node.call(this, opts) || this;
    _this.type = _types.COMBINATOR;
    return _this;
  }

  return Combinator;
}(_node["default"]);

exports.default = Combinator;
module.exports = exports.default;

/***/ }),

/***/ 974:
/***/ ((module, exports, __nccwpck_require__) => {

"use strict";


exports.__esModule = true;
exports.default = void 0;

var _node = _interopRequireDefault(__nccwpck_require__(3206));

var _types = __nccwpck_require__(6895);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var Comment = /*#__PURE__*/function (_Node) {
  _inheritsLoose(Comment, _Node);

  function Comment(opts) {
    var _this;

    _this = _Node.call(this, opts) || this;
    _this.type = _types.COMMENT;
    return _this;
  }

  return Comment;
}(_node["default"]);

exports.default = Comment;
module.exports = exports.default;

/***/ }),

/***/ 5850:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";


exports.__esModule = true;
exports.universal = exports.tag = exports.string = exports.selector = exports.root = exports.pseudo = exports.nesting = exports.id = exports.comment = exports.combinator = exports.className = exports.attribute = void 0;

var _attribute = _interopRequireDefault(__nccwpck_require__(326));

var _className = _interopRequireDefault(__nccwpck_require__(9780));

var _combinator = _interopRequireDefault(__nccwpck_require__(8765));

var _comment = _interopRequireDefault(__nccwpck_require__(974));

var _id = _interopRequireDefault(__nccwpck_require__(2050));

var _nesting = _interopRequireDefault(__nccwpck_require__(9497));

var _pseudo = _interopRequireDefault(__nccwpck_require__(8681));

var _root = _interopRequireDefault(__nccwpck_require__(4804));

var _selector = _interopRequireDefault(__nccwpck_require__(7370));

var _string = _interopRequireDefault(__nccwpck_require__(2391));

var _tag = _interopRequireDefault(__nccwpck_require__(9646));

var _universal = _interopRequireDefault(__nccwpck_require__(4843));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var attribute = function attribute(opts) {
  return new _attribute["default"](opts);
};

exports.attribute = attribute;

var className = function className(opts) {
  return new _className["default"](opts);
};

exports.className = className;

var combinator = function combinator(opts) {
  return new _combinator["default"](opts);
};

exports.combinator = combinator;

var comment = function comment(opts) {
  return new _comment["default"](opts);
};

exports.comment = comment;

var id = function id(opts) {
  return new _id["default"](opts);
};

exports.id = id;

var nesting = function nesting(opts) {
  return new _nesting["default"](opts);
};

exports.nesting = nesting;

var pseudo = function pseudo(opts) {
  return new _pseudo["default"](opts);
};

exports.pseudo = pseudo;

var root = function root(opts) {
  return new _root["default"](opts);
};

exports.root = root;

var selector = function selector(opts) {
  return new _selector["default"](opts);
};

exports.selector = selector;

var string = function string(opts) {
  return new _string["default"](opts);
};

exports.string = string;

var tag = function tag(opts) {
  return new _tag["default"](opts);
};

exports.tag = tag;

var universal = function universal(opts) {
  return new _universal["default"](opts);
};

exports.universal = universal;

/***/ }),

/***/ 7240:
/***/ ((module, exports, __nccwpck_require__) => {

"use strict";


exports.__esModule = true;
exports.default = void 0;

var _node = _interopRequireDefault(__nccwpck_require__(3206));

var types = _interopRequireWildcard(__nccwpck_require__(6895));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _createForOfIteratorHelperLoose(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; return function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } it = o[Symbol.iterator](); return it.next.bind(it); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var Container = /*#__PURE__*/function (_Node) {
  _inheritsLoose(Container, _Node);

  function Container(opts) {
    var _this;

    _this = _Node.call(this, opts) || this;

    if (!_this.nodes) {
      _this.nodes = [];
    }

    return _this;
  }

  var _proto = Container.prototype;

  _proto.append = function append(selector) {
    selector.parent = this;
    this.nodes.push(selector);
    return this;
  };

  _proto.prepend = function prepend(selector) {
    selector.parent = this;
    this.nodes.unshift(selector);
    return this;
  };

  _proto.at = function at(index) {
    return this.nodes[index];
  };

  _proto.index = function index(child) {
    if (typeof child === 'number') {
      return child;
    }

    return this.nodes.indexOf(child);
  };

  _proto.removeChild = function removeChild(child) {
    child = this.index(child);
    this.at(child).parent = undefined;
    this.nodes.splice(child, 1);
    var index;

    for (var id in this.indexes) {
      index = this.indexes[id];

      if (index >= child) {
        this.indexes[id] = index - 1;
      }
    }

    return this;
  };

  _proto.removeAll = function removeAll() {
    for (var _iterator = _createForOfIteratorHelperLoose(this.nodes), _step; !(_step = _iterator()).done;) {
      var node = _step.value;
      node.parent = undefined;
    }

    this.nodes = [];
    return this;
  };

  _proto.empty = function empty() {
    return this.removeAll();
  };

  _proto.insertAfter = function insertAfter(oldNode, newNode) {
    newNode.parent = this;
    var oldIndex = this.index(oldNode);
    this.nodes.splice(oldIndex + 1, 0, newNode);
    newNode.parent = this;
    var index;

    for (var id in this.indexes) {
      index = this.indexes[id];

      if (oldIndex <= index) {
        this.indexes[id] = index + 1;
      }
    }

    return this;
  };

  _proto.insertBefore = function insertBefore(oldNode, newNode) {
    newNode.parent = this;
    var oldIndex = this.index(oldNode);
    this.nodes.splice(oldIndex, 0, newNode);
    newNode.parent = this;
    var index;

    for (var id in this.indexes) {
      index = this.indexes[id];

      if (index <= oldIndex) {
        this.indexes[id] = index + 1;
      }
    }

    return this;
  };

  _proto._findChildAtPosition = function _findChildAtPosition(line, col) {
    var found = undefined;
    this.each(function (node) {
      if (node.atPosition) {
        var foundChild = node.atPosition(line, col);

        if (foundChild) {
          found = foundChild;
          return false;
        }
      } else if (node.isAtPosition(line, col)) {
        found = node;
        return false;
      }
    });
    return found;
  }
  /**
   * Return the most specific node at the line and column number given.
   * The source location is based on the original parsed location, locations aren't
   * updated as selector nodes are mutated.
   * 
   * Note that this location is relative to the location of the first character
   * of the selector, and not the location of the selector in the overall document
   * when used in conjunction with postcss.
   *
   * If not found, returns undefined.
   * @param {number} line The line number of the node to find. (1-based index)
   * @param {number} col  The column number of the node to find. (1-based index)
   */
  ;

  _proto.atPosition = function atPosition(line, col) {
    if (this.isAtPosition(line, col)) {
      return this._findChildAtPosition(line, col) || this;
    } else {
      return undefined;
    }
  };

  _proto._inferEndPosition = function _inferEndPosition() {
    if (this.last && this.last.source && this.last.source.end) {
      this.source = this.source || {};
      this.source.end = this.source.end || {};
      Object.assign(this.source.end, this.last.source.end);
    }
  };

  _proto.each = function each(callback) {
    if (!this.lastEach) {
      this.lastEach = 0;
    }

    if (!this.indexes) {
      this.indexes = {};
    }

    this.lastEach++;
    var id = this.lastEach;
    this.indexes[id] = 0;

    if (!this.length) {
      return undefined;
    }

    var index, result;

    while (this.indexes[id] < this.length) {
      index = this.indexes[id];
      result = callback(this.at(index), index);

      if (result === false) {
        break;
      }

      this.indexes[id] += 1;
    }

    delete this.indexes[id];

    if (result === false) {
      return false;
    }
  };

  _proto.walk = function walk(callback) {
    return this.each(function (node, i) {
      var result = callback(node, i);

      if (result !== false && node.length) {
        result = node.walk(callback);
      }

      if (result === false) {
        return false;
      }
    });
  };

  _proto.walkAttributes = function walkAttributes(callback) {
    var _this2 = this;

    return this.walk(function (selector) {
      if (selector.type === types.ATTRIBUTE) {
        return callback.call(_this2, selector);
      }
    });
  };

  _proto.walkClasses = function walkClasses(callback) {
    var _this3 = this;

    return this.walk(function (selector) {
      if (selector.type === types.CLASS) {
        return callback.call(_this3, selector);
      }
    });
  };

  _proto.walkCombinators = function walkCombinators(callback) {
    var _this4 = this;

    return this.walk(function (selector) {
      if (selector.type === types.COMBINATOR) {
        return callback.call(_this4, selector);
      }
    });
  };

  _proto.walkComments = function walkComments(callback) {
    var _this5 = this;

    return this.walk(function (selector) {
      if (selector.type === types.COMMENT) {
        return callback.call(_this5, selector);
      }
    });
  };

  _proto.walkIds = function walkIds(callback) {
    var _this6 = this;

    return this.walk(function (selector) {
      if (selector.type === types.ID) {
        return callback.call(_this6, selector);
      }
    });
  };

  _proto.walkNesting = function walkNesting(callback) {
    var _this7 = this;

    return this.walk(function (selector) {
      if (selector.type === types.NESTING) {
        return callback.call(_this7, selector);
      }
    });
  };

  _proto.walkPseudos = function walkPseudos(callback) {
    var _this8 = this;

    return this.walk(function (selector) {
      if (selector.type === types.PSEUDO) {
        return callback.call(_this8, selector);
      }
    });
  };

  _proto.walkTags = function walkTags(callback) {
    var _this9 = this;

    return this.walk(function (selector) {
      if (selector.type === types.TAG) {
        return callback.call(_this9, selector);
      }
    });
  };

  _proto.walkUniversals = function walkUniversals(callback) {
    var _this10 = this;

    return this.walk(function (selector) {
      if (selector.type === types.UNIVERSAL) {
        return callback.call(_this10, selector);
      }
    });
  };

  _proto.split = function split(callback) {
    var _this11 = this;

    var current = [];
    return this.reduce(function (memo, node, index) {
      var split = callback.call(_this11, node);
      current.push(node);

      if (split) {
        memo.push(current);
        current = [];
      } else if (index === _this11.length - 1) {
        memo.push(current);
      }

      return memo;
    }, []);
  };

  _proto.map = function map(callback) {
    return this.nodes.map(callback);
  };

  _proto.reduce = function reduce(callback, memo) {
    return this.nodes.reduce(callback, memo);
  };

  _proto.every = function every(callback) {
    return this.nodes.every(callback);
  };

  _proto.some = function some(callback) {
    return this.nodes.some(callback);
  };

  _proto.filter = function filter(callback) {
    return this.nodes.filter(callback);
  };

  _proto.sort = function sort(callback) {
    return this.nodes.sort(callback);
  };

  _proto.toString = function toString() {
    return this.map(String).join('');
  };

  _createClass(Container, [{
    key: "first",
    get: function get() {
      return this.at(0);
    }
  }, {
    key: "last",
    get: function get() {
      return this.at(this.length - 1);
    }
  }, {
    key: "length",
    get: function get() {
      return this.nodes.length;
    }
  }]);

  return Container;
}(_node["default"]);

exports.default = Container;
module.exports = exports.default;

/***/ }),

/***/ 5873:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";


exports.__esModule = true;
exports.isNode = isNode;
exports.isPseudoElement = isPseudoElement;
exports.isPseudoClass = isPseudoClass;
exports.isContainer = isContainer;
exports.isNamespace = isNamespace;
exports.isUniversal = exports.isTag = exports.isString = exports.isSelector = exports.isRoot = exports.isPseudo = exports.isNesting = exports.isIdentifier = exports.isComment = exports.isCombinator = exports.isClassName = exports.isAttribute = void 0;

var _types = __nccwpck_require__(6895);

var _IS_TYPE;

var IS_TYPE = (_IS_TYPE = {}, _IS_TYPE[_types.ATTRIBUTE] = true, _IS_TYPE[_types.CLASS] = true, _IS_TYPE[_types.COMBINATOR] = true, _IS_TYPE[_types.COMMENT] = true, _IS_TYPE[_types.ID] = true, _IS_TYPE[_types.NESTING] = true, _IS_TYPE[_types.PSEUDO] = true, _IS_TYPE[_types.ROOT] = true, _IS_TYPE[_types.SELECTOR] = true, _IS_TYPE[_types.STRING] = true, _IS_TYPE[_types.TAG] = true, _IS_TYPE[_types.UNIVERSAL] = true, _IS_TYPE);

function isNode(node) {
  return typeof node === "object" && IS_TYPE[node.type];
}

function isNodeType(type, node) {
  return isNode(node) && node.type === type;
}

var isAttribute = isNodeType.bind(null, _types.ATTRIBUTE);
exports.isAttribute = isAttribute;
var isClassName = isNodeType.bind(null, _types.CLASS);
exports.isClassName = isClassName;
var isCombinator = isNodeType.bind(null, _types.COMBINATOR);
exports.isCombinator = isCombinator;
var isComment = isNodeType.bind(null, _types.COMMENT);
exports.isComment = isComment;
var isIdentifier = isNodeType.bind(null, _types.ID);
exports.isIdentifier = isIdentifier;
var isNesting = isNodeType.bind(null, _types.NESTING);
exports.isNesting = isNesting;
var isPseudo = isNodeType.bind(null, _types.PSEUDO);
exports.isPseudo = isPseudo;
var isRoot = isNodeType.bind(null, _types.ROOT);
exports.isRoot = isRoot;
var isSelector = isNodeType.bind(null, _types.SELECTOR);
exports.isSelector = isSelector;
var isString = isNodeType.bind(null, _types.STRING);
exports.isString = isString;
var isTag = isNodeType.bind(null, _types.TAG);
exports.isTag = isTag;
var isUniversal = isNodeType.bind(null, _types.UNIVERSAL);
exports.isUniversal = isUniversal;

function isPseudoElement(node) {
  return isPseudo(node) && node.value && (node.value.startsWith("::") || node.value.toLowerCase() === ":before" || node.value.toLowerCase() === ":after");
}

function isPseudoClass(node) {
  return isPseudo(node) && !isPseudoElement(node);
}

function isContainer(node) {
  return !!(isNode(node) && node.walk);
}

function isNamespace(node) {
  return isAttribute(node) || isTag(node);
}

/***/ }),

/***/ 2050:
/***/ ((module, exports, __nccwpck_require__) => {

"use strict";


exports.__esModule = true;
exports.default = void 0;

var _node = _interopRequireDefault(__nccwpck_require__(3206));

var _types = __nccwpck_require__(6895);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var ID = /*#__PURE__*/function (_Node) {
  _inheritsLoose(ID, _Node);

  function ID(opts) {
    var _this;

    _this = _Node.call(this, opts) || this;
    _this.type = _types.ID;
    return _this;
  }

  var _proto = ID.prototype;

  _proto.valueToString = function valueToString() {
    return '#' + _Node.prototype.valueToString.call(this);
  };

  return ID;
}(_node["default"]);

exports.default = ID;
module.exports = exports.default;

/***/ }),

/***/ 1483:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";


exports.__esModule = true;

var _types = __nccwpck_require__(6895);

Object.keys(_types).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _types[key]) return;
  exports[key] = _types[key];
});

var _constructors = __nccwpck_require__(5850);

Object.keys(_constructors).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _constructors[key]) return;
  exports[key] = _constructors[key];
});

var _guards = __nccwpck_require__(5873);

Object.keys(_guards).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _guards[key]) return;
  exports[key] = _guards[key];
});

/***/ }),

/***/ 5669:
/***/ ((module, exports, __nccwpck_require__) => {

"use strict";


exports.__esModule = true;
exports.default = void 0;

var _cssesc = _interopRequireDefault(__nccwpck_require__(3120));

var _util = __nccwpck_require__(3621);

var _node = _interopRequireDefault(__nccwpck_require__(3206));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var Namespace = /*#__PURE__*/function (_Node) {
  _inheritsLoose(Namespace, _Node);

  function Namespace() {
    return _Node.apply(this, arguments) || this;
  }

  var _proto = Namespace.prototype;

  _proto.qualifiedName = function qualifiedName(value) {
    if (this.namespace) {
      return this.namespaceString + "|" + value;
    } else {
      return value;
    }
  };

  _proto.valueToString = function valueToString() {
    return this.qualifiedName(_Node.prototype.valueToString.call(this));
  };

  _createClass(Namespace, [{
    key: "namespace",
    get: function get() {
      return this._namespace;
    },
    set: function set(namespace) {
      if (namespace === true || namespace === "*" || namespace === "&") {
        this._namespace = namespace;

        if (this.raws) {
          delete this.raws.namespace;
        }

        return;
      }

      var escaped = (0, _cssesc["default"])(namespace, {
        isIdentifier: true
      });
      this._namespace = namespace;

      if (escaped !== namespace) {
        (0, _util.ensureObject)(this, "raws");
        this.raws.namespace = escaped;
      } else if (this.raws) {
        delete this.raws.namespace;
      }
    }
  }, {
    key: "ns",
    get: function get() {
      return this._namespace;
    },
    set: function set(namespace) {
      this.namespace = namespace;
    }
  }, {
    key: "namespaceString",
    get: function get() {
      if (this.namespace) {
        var ns = this.stringifyProperty("namespace");

        if (ns === true) {
          return '';
        } else {
          return ns;
        }
      } else {
        return '';
      }
    }
  }]);

  return Namespace;
}(_node["default"]);

exports.default = Namespace;
;
module.exports = exports.default;

/***/ }),

/***/ 9497:
/***/ ((module, exports, __nccwpck_require__) => {

"use strict";


exports.__esModule = true;
exports.default = void 0;

var _node = _interopRequireDefault(__nccwpck_require__(3206));

var _types = __nccwpck_require__(6895);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var Nesting = /*#__PURE__*/function (_Node) {
  _inheritsLoose(Nesting, _Node);

  function Nesting(opts) {
    var _this;

    _this = _Node.call(this, opts) || this;
    _this.type = _types.NESTING;
    _this.value = '&';
    return _this;
  }

  return Nesting;
}(_node["default"]);

exports.default = Nesting;
module.exports = exports.default;

/***/ }),

/***/ 3206:
/***/ ((module, exports, __nccwpck_require__) => {

"use strict";


exports.__esModule = true;
exports.default = void 0;

var _util = __nccwpck_require__(3621);

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var cloneNode = function cloneNode(obj, parent) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  var cloned = new obj.constructor();

  for (var i in obj) {
    if (!obj.hasOwnProperty(i)) {
      continue;
    }

    var value = obj[i];
    var type = typeof value;

    if (i === 'parent' && type === 'object') {
      if (parent) {
        cloned[i] = parent;
      }
    } else if (value instanceof Array) {
      cloned[i] = value.map(function (j) {
        return cloneNode(j, cloned);
      });
    } else {
      cloned[i] = cloneNode(value, cloned);
    }
  }

  return cloned;
};

var Node = /*#__PURE__*/function () {
  function Node(opts) {
    if (opts === void 0) {
      opts = {};
    }

    Object.assign(this, opts);
    this.spaces = this.spaces || {};
    this.spaces.before = this.spaces.before || '';
    this.spaces.after = this.spaces.after || '';
  }

  var _proto = Node.prototype;

  _proto.remove = function remove() {
    if (this.parent) {
      this.parent.removeChild(this);
    }

    this.parent = undefined;
    return this;
  };

  _proto.replaceWith = function replaceWith() {
    if (this.parent) {
      for (var index in arguments) {
        this.parent.insertBefore(this, arguments[index]);
      }

      this.remove();
    }

    return this;
  };

  _proto.next = function next() {
    return this.parent.at(this.parent.index(this) + 1);
  };

  _proto.prev = function prev() {
    return this.parent.at(this.parent.index(this) - 1);
  };

  _proto.clone = function clone(overrides) {
    if (overrides === void 0) {
      overrides = {};
    }

    var cloned = cloneNode(this);

    for (var name in overrides) {
      cloned[name] = overrides[name];
    }

    return cloned;
  }
  /**
   * Some non-standard syntax doesn't follow normal escaping rules for css.
   * This allows non standard syntax to be appended to an existing property
   * by specifying the escaped value. By specifying the escaped value,
   * illegal characters are allowed to be directly inserted into css output.
   * @param {string} name the property to set
   * @param {any} value the unescaped value of the property
   * @param {string} valueEscaped optional. the escaped value of the property.
   */
  ;

  _proto.appendToPropertyAndEscape = function appendToPropertyAndEscape(name, value, valueEscaped) {
    if (!this.raws) {
      this.raws = {};
    }

    var originalValue = this[name];
    var originalEscaped = this.raws[name];
    this[name] = originalValue + value; // this may trigger a setter that updates raws, so it has to be set first.

    if (originalEscaped || valueEscaped !== value) {
      this.raws[name] = (originalEscaped || originalValue) + valueEscaped;
    } else {
      delete this.raws[name]; // delete any escaped value that was created by the setter.
    }
  }
  /**
   * Some non-standard syntax doesn't follow normal escaping rules for css.
   * This allows the escaped value to be specified directly, allowing illegal
   * characters to be directly inserted into css output.
   * @param {string} name the property to set
   * @param {any} value the unescaped value of the property
   * @param {string} valueEscaped the escaped value of the property.
   */
  ;

  _proto.setPropertyAndEscape = function setPropertyAndEscape(name, value, valueEscaped) {
    if (!this.raws) {
      this.raws = {};
    }

    this[name] = value; // this may trigger a setter that updates raws, so it has to be set first.

    this.raws[name] = valueEscaped;
  }
  /**
   * When you want a value to passed through to CSS directly. This method
   * deletes the corresponding raw value causing the stringifier to fallback
   * to the unescaped value.
   * @param {string} name the property to set.
   * @param {any} value The value that is both escaped and unescaped.
   */
  ;

  _proto.setPropertyWithoutEscape = function setPropertyWithoutEscape(name, value) {
    this[name] = value; // this may trigger a setter that updates raws, so it has to be set first.

    if (this.raws) {
      delete this.raws[name];
    }
  }
  /**
   *
   * @param {number} line The number (starting with 1)
   * @param {number} column The column number (starting with 1)
   */
  ;

  _proto.isAtPosition = function isAtPosition(line, column) {
    if (this.source && this.source.start && this.source.end) {
      if (this.source.start.line > line) {
        return false;
      }

      if (this.source.end.line < line) {
        return false;
      }

      if (this.source.start.line === line && this.source.start.column > column) {
        return false;
      }

      if (this.source.end.line === line && this.source.end.column < column) {
        return false;
      }

      return true;
    }

    return undefined;
  };

  _proto.stringifyProperty = function stringifyProperty(name) {
    return this.raws && this.raws[name] || this[name];
  };

  _proto.valueToString = function valueToString() {
    return String(this.stringifyProperty("value"));
  };

  _proto.toString = function toString() {
    return [this.rawSpaceBefore, this.valueToString(), this.rawSpaceAfter].join('');
  };

  _createClass(Node, [{
    key: "rawSpaceBefore",
    get: function get() {
      var rawSpace = this.raws && this.raws.spaces && this.raws.spaces.before;

      if (rawSpace === undefined) {
        rawSpace = this.spaces && this.spaces.before;
      }

      return rawSpace || "";
    },
    set: function set(raw) {
      (0, _util.ensureObject)(this, "raws", "spaces");
      this.raws.spaces.before = raw;
    }
  }, {
    key: "rawSpaceAfter",
    get: function get() {
      var rawSpace = this.raws && this.raws.spaces && this.raws.spaces.after;

      if (rawSpace === undefined) {
        rawSpace = this.spaces.after;
      }

      return rawSpace || "";
    },
    set: function set(raw) {
      (0, _util.ensureObject)(this, "raws", "spaces");
      this.raws.spaces.after = raw;
    }
  }]);

  return Node;
}();

exports.default = Node;
module.exports = exports.default;

/***/ }),

/***/ 8681:
/***/ ((module, exports, __nccwpck_require__) => {

"use strict";


exports.__esModule = true;
exports.default = void 0;

var _container = _interopRequireDefault(__nccwpck_require__(7240));

var _types = __nccwpck_require__(6895);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var Pseudo = /*#__PURE__*/function (_Container) {
  _inheritsLoose(Pseudo, _Container);

  function Pseudo(opts) {
    var _this;

    _this = _Container.call(this, opts) || this;
    _this.type = _types.PSEUDO;
    return _this;
  }

  var _proto = Pseudo.prototype;

  _proto.toString = function toString() {
    var params = this.length ? '(' + this.map(String).join(',') + ')' : '';
    return [this.rawSpaceBefore, this.stringifyProperty("value"), params, this.rawSpaceAfter].join('');
  };

  return Pseudo;
}(_container["default"]);

exports.default = Pseudo;
module.exports = exports.default;

/***/ }),

/***/ 4804:
/***/ ((module, exports, __nccwpck_require__) => {

"use strict";


exports.__esModule = true;
exports.default = void 0;

var _container = _interopRequireDefault(__nccwpck_require__(7240));

var _types = __nccwpck_require__(6895);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var Root = /*#__PURE__*/function (_Container) {
  _inheritsLoose(Root, _Container);

  function Root(opts) {
    var _this;

    _this = _Container.call(this, opts) || this;
    _this.type = _types.ROOT;
    return _this;
  }

  var _proto = Root.prototype;

  _proto.toString = function toString() {
    var str = this.reduce(function (memo, selector) {
      memo.push(String(selector));
      return memo;
    }, []).join(',');
    return this.trailingComma ? str + ',' : str;
  };

  _proto.error = function error(message, options) {
    if (this._error) {
      return this._error(message, options);
    } else {
      return new Error(message);
    }
  };

  _createClass(Root, [{
    key: "errorGenerator",
    set: function set(handler) {
      this._error = handler;
    }
  }]);

  return Root;
}(_container["default"]);

exports.default = Root;
module.exports = exports.default;

/***/ }),

/***/ 7370:
/***/ ((module, exports, __nccwpck_require__) => {

"use strict";


exports.__esModule = true;
exports.default = void 0;

var _container = _interopRequireDefault(__nccwpck_require__(7240));

var _types = __nccwpck_require__(6895);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var Selector = /*#__PURE__*/function (_Container) {
  _inheritsLoose(Selector, _Container);

  function Selector(opts) {
    var _this;

    _this = _Container.call(this, opts) || this;
    _this.type = _types.SELECTOR;
    return _this;
  }

  return Selector;
}(_container["default"]);

exports.default = Selector;
module.exports = exports.default;

/***/ }),

/***/ 2391:
/***/ ((module, exports, __nccwpck_require__) => {

"use strict";


exports.__esModule = true;
exports.default = void 0;

var _node = _interopRequireDefault(__nccwpck_require__(3206));

var _types = __nccwpck_require__(6895);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var String = /*#__PURE__*/function (_Node) {
  _inheritsLoose(String, _Node);

  function String(opts) {
    var _this;

    _this = _Node.call(this, opts) || this;
    _this.type = _types.STRING;
    return _this;
  }

  return String;
}(_node["default"]);

exports.default = String;
module.exports = exports.default;

/***/ }),

/***/ 9646:
/***/ ((module, exports, __nccwpck_require__) => {

"use strict";


exports.__esModule = true;
exports.default = void 0;

var _namespace = _interopRequireDefault(__nccwpck_require__(5669));

var _types = __nccwpck_require__(6895);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var Tag = /*#__PURE__*/function (_Namespace) {
  _inheritsLoose(Tag, _Namespace);

  function Tag(opts) {
    var _this;

    _this = _Namespace.call(this, opts) || this;
    _this.type = _types.TAG;
    return _this;
  }

  return Tag;
}(_namespace["default"]);

exports.default = Tag;
module.exports = exports.default;

/***/ }),

/***/ 6895:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


exports.__esModule = true;
exports.UNIVERSAL = exports.ATTRIBUTE = exports.CLASS = exports.COMBINATOR = exports.COMMENT = exports.ID = exports.NESTING = exports.PSEUDO = exports.ROOT = exports.SELECTOR = exports.STRING = exports.TAG = void 0;
var TAG = 'tag';
exports.TAG = TAG;
var STRING = 'string';
exports.STRING = STRING;
var SELECTOR = 'selector';
exports.SELECTOR = SELECTOR;
var ROOT = 'root';
exports.ROOT = ROOT;
var PSEUDO = 'pseudo';
exports.PSEUDO = PSEUDO;
var NESTING = 'nesting';
exports.NESTING = NESTING;
var ID = 'id';
exports.ID = ID;
var COMMENT = 'comment';
exports.COMMENT = COMMENT;
var COMBINATOR = 'combinator';
exports.COMBINATOR = COMBINATOR;
var CLASS = 'class';
exports.CLASS = CLASS;
var ATTRIBUTE = 'attribute';
exports.ATTRIBUTE = ATTRIBUTE;
var UNIVERSAL = 'universal';
exports.UNIVERSAL = UNIVERSAL;

/***/ }),

/***/ 4843:
/***/ ((module, exports, __nccwpck_require__) => {

"use strict";


exports.__esModule = true;
exports.default = void 0;

var _namespace = _interopRequireDefault(__nccwpck_require__(5669));

var _types = __nccwpck_require__(6895);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var Universal = /*#__PURE__*/function (_Namespace) {
  _inheritsLoose(Universal, _Namespace);

  function Universal(opts) {
    var _this;

    _this = _Namespace.call(this, opts) || this;
    _this.type = _types.UNIVERSAL;
    _this.value = '*';
    return _this;
  }

  return Universal;
}(_namespace["default"]);

exports.default = Universal;
module.exports = exports.default;

/***/ }),

/***/ 8520:
/***/ ((module, exports) => {

"use strict";


exports.__esModule = true;
exports.default = sortAscending;

function sortAscending(list) {
  return list.sort(function (a, b) {
    return a - b;
  });
}

;
module.exports = exports.default;

/***/ }),

/***/ 6684:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


exports.__esModule = true;
exports.combinator = exports.word = exports.comment = exports.str = exports.tab = exports.newline = exports.feed = exports.cr = exports.backslash = exports.bang = exports.slash = exports.doubleQuote = exports.singleQuote = exports.space = exports.greaterThan = exports.pipe = exports.equals = exports.plus = exports.caret = exports.tilde = exports.dollar = exports.closeSquare = exports.openSquare = exports.closeParenthesis = exports.openParenthesis = exports.semicolon = exports.colon = exports.comma = exports.at = exports.asterisk = exports.ampersand = void 0;
var ampersand = 38; // `&`.charCodeAt(0);

exports.ampersand = ampersand;
var asterisk = 42; // `*`.charCodeAt(0);

exports.asterisk = asterisk;
var at = 64; // `@`.charCodeAt(0);

exports.at = at;
var comma = 44; // `,`.charCodeAt(0);

exports.comma = comma;
var colon = 58; // `:`.charCodeAt(0);

exports.colon = colon;
var semicolon = 59; // `;`.charCodeAt(0);

exports.semicolon = semicolon;
var openParenthesis = 40; // `(`.charCodeAt(0);

exports.openParenthesis = openParenthesis;
var closeParenthesis = 41; // `)`.charCodeAt(0);

exports.closeParenthesis = closeParenthesis;
var openSquare = 91; // `[`.charCodeAt(0);

exports.openSquare = openSquare;
var closeSquare = 93; // `]`.charCodeAt(0);

exports.closeSquare = closeSquare;
var dollar = 36; // `$`.charCodeAt(0);

exports.dollar = dollar;
var tilde = 126; // `~`.charCodeAt(0);

exports.tilde = tilde;
var caret = 94; // `^`.charCodeAt(0);

exports.caret = caret;
var plus = 43; // `+`.charCodeAt(0);

exports.plus = plus;
var equals = 61; // `=`.charCodeAt(0);

exports.equals = equals;
var pipe = 124; // `|`.charCodeAt(0);

exports.pipe = pipe;
var greaterThan = 62; // `>`.charCodeAt(0);

exports.greaterThan = greaterThan;
var space = 32; // ` `.charCodeAt(0);

exports.space = space;
var singleQuote = 39; // `'`.charCodeAt(0);

exports.singleQuote = singleQuote;
var doubleQuote = 34; // `"`.charCodeAt(0);

exports.doubleQuote = doubleQuote;
var slash = 47; // `/`.charCodeAt(0);

exports.slash = slash;
var bang = 33; // `!`.charCodeAt(0);

exports.bang = bang;
var backslash = 92; // '\\'.charCodeAt(0);

exports.backslash = backslash;
var cr = 13; // '\r'.charCodeAt(0);

exports.cr = cr;
var feed = 12; // '\f'.charCodeAt(0);

exports.feed = feed;
var newline = 10; // '\n'.charCodeAt(0);

exports.newline = newline;
var tab = 9; // '\t'.charCodeAt(0);
// Expose aliases primarily for readability.

exports.tab = tab;
var str = singleQuote; // No good single character representation!

exports.str = str;
var comment = -1;
exports.comment = comment;
var word = -2;
exports.word = word;
var combinator = -3;
exports.combinator = combinator;

/***/ }),

/***/ 3370:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";


exports.__esModule = true;
exports.default = tokenize;
exports.FIELDS = void 0;

var t = _interopRequireWildcard(__nccwpck_require__(6684));

var _unescapable, _wordDelimiters;

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

var unescapable = (_unescapable = {}, _unescapable[t.tab] = true, _unescapable[t.newline] = true, _unescapable[t.cr] = true, _unescapable[t.feed] = true, _unescapable);
var wordDelimiters = (_wordDelimiters = {}, _wordDelimiters[t.space] = true, _wordDelimiters[t.tab] = true, _wordDelimiters[t.newline] = true, _wordDelimiters[t.cr] = true, _wordDelimiters[t.feed] = true, _wordDelimiters[t.ampersand] = true, _wordDelimiters[t.asterisk] = true, _wordDelimiters[t.bang] = true, _wordDelimiters[t.comma] = true, _wordDelimiters[t.colon] = true, _wordDelimiters[t.semicolon] = true, _wordDelimiters[t.openParenthesis] = true, _wordDelimiters[t.closeParenthesis] = true, _wordDelimiters[t.openSquare] = true, _wordDelimiters[t.closeSquare] = true, _wordDelimiters[t.singleQuote] = true, _wordDelimiters[t.doubleQuote] = true, _wordDelimiters[t.plus] = true, _wordDelimiters[t.pipe] = true, _wordDelimiters[t.tilde] = true, _wordDelimiters[t.greaterThan] = true, _wordDelimiters[t.equals] = true, _wordDelimiters[t.dollar] = true, _wordDelimiters[t.caret] = true, _wordDelimiters[t.slash] = true, _wordDelimiters);
var hex = {};
var hexChars = "0123456789abcdefABCDEF";

for (var i = 0; i < hexChars.length; i++) {
  hex[hexChars.charCodeAt(i)] = true;
}
/**
 *  Returns the last index of the bar css word
 * @param {string} css The string in which the word begins
 * @param {number} start The index into the string where word's first letter occurs
 */


function consumeWord(css, start) {
  var next = start;
  var code;

  do {
    code = css.charCodeAt(next);

    if (wordDelimiters[code]) {
      return next - 1;
    } else if (code === t.backslash) {
      next = consumeEscape(css, next) + 1;
    } else {
      // All other characters are part of the word
      next++;
    }
  } while (next < css.length);

  return next - 1;
}
/**
 *  Returns the last index of the escape sequence
 * @param {string} css The string in which the sequence begins
 * @param {number} start The index into the string where escape character (`\`) occurs.
 */


function consumeEscape(css, start) {
  var next = start;
  var code = css.charCodeAt(next + 1);

  if (unescapable[code]) {// just consume the escape char
  } else if (hex[code]) {
    var hexDigits = 0; // consume up to 6 hex chars

    do {
      next++;
      hexDigits++;
      code = css.charCodeAt(next + 1);
    } while (hex[code] && hexDigits < 6); // if fewer than 6 hex chars, a trailing space ends the escape


    if (hexDigits < 6 && code === t.space) {
      next++;
    }
  } else {
    // the next char is part of the current word
    next++;
  }

  return next;
}

var FIELDS = {
  TYPE: 0,
  START_LINE: 1,
  START_COL: 2,
  END_LINE: 3,
  END_COL: 4,
  START_POS: 5,
  END_POS: 6
};
exports.FIELDS = FIELDS;

function tokenize(input) {
  var tokens = [];
  var css = input.css.valueOf();
  var _css = css,
      length = _css.length;
  var offset = -1;
  var line = 1;
  var start = 0;
  var end = 0;
  var code, content, endColumn, endLine, escaped, escapePos, last, lines, next, nextLine, nextOffset, quote, tokenType;

  function unclosed(what, fix) {
    if (input.safe) {
      // fyi: this is never set to true.
      css += fix;
      next = css.length - 1;
    } else {
      throw input.error('Unclosed ' + what, line, start - offset, start);
    }
  }

  while (start < length) {
    code = css.charCodeAt(start);

    if (code === t.newline) {
      offset = start;
      line += 1;
    }

    switch (code) {
      case t.space:
      case t.tab:
      case t.newline:
      case t.cr:
      case t.feed:
        next = start;

        do {
          next += 1;
          code = css.charCodeAt(next);

          if (code === t.newline) {
            offset = next;
            line += 1;
          }
        } while (code === t.space || code === t.newline || code === t.tab || code === t.cr || code === t.feed);

        tokenType = t.space;
        endLine = line;
        endColumn = next - offset - 1;
        end = next;
        break;

      case t.plus:
      case t.greaterThan:
      case t.tilde:
      case t.pipe:
        next = start;

        do {
          next += 1;
          code = css.charCodeAt(next);
        } while (code === t.plus || code === t.greaterThan || code === t.tilde || code === t.pipe);

        tokenType = t.combinator;
        endLine = line;
        endColumn = start - offset;
        end = next;
        break;
      // Consume these characters as single tokens.

      case t.asterisk:
      case t.ampersand:
      case t.bang:
      case t.comma:
      case t.equals:
      case t.dollar:
      case t.caret:
      case t.openSquare:
      case t.closeSquare:
      case t.colon:
      case t.semicolon:
      case t.openParenthesis:
      case t.closeParenthesis:
        next = start;
        tokenType = code;
        endLine = line;
        endColumn = start - offset;
        end = next + 1;
        break;

      case t.singleQuote:
      case t.doubleQuote:
        quote = code === t.singleQuote ? "'" : '"';
        next = start;

        do {
          escaped = false;
          next = css.indexOf(quote, next + 1);

          if (next === -1) {
            unclosed('quote', quote);
          }

          escapePos = next;

          while (css.charCodeAt(escapePos - 1) === t.backslash) {
            escapePos -= 1;
            escaped = !escaped;
          }
        } while (escaped);

        tokenType = t.str;
        endLine = line;
        endColumn = start - offset;
        end = next + 1;
        break;

      default:
        if (code === t.slash && css.charCodeAt(start + 1) === t.asterisk) {
          next = css.indexOf('*/', start + 2) + 1;

          if (next === 0) {
            unclosed('comment', '*/');
          }

          content = css.slice(start, next + 1);
          lines = content.split('\n');
          last = lines.length - 1;

          if (last > 0) {
            nextLine = line + last;
            nextOffset = next - lines[last].length;
          } else {
            nextLine = line;
            nextOffset = offset;
          }

          tokenType = t.comment;
          line = nextLine;
          endLine = nextLine;
          endColumn = next - nextOffset;
        } else if (code === t.slash) {
          next = start;
          tokenType = code;
          endLine = line;
          endColumn = start - offset;
          end = next + 1;
        } else {
          next = consumeWord(css, start);
          tokenType = t.word;
          endLine = line;
          endColumn = next - offset;
        }

        end = next + 1;
        break;
    } // Ensure that the token structure remains consistent


    tokens.push([tokenType, // [0] Token type
    line, // [1] Starting line
    start - offset, // [2] Starting column
    endLine, // [3] Ending line
    endColumn, // [4] Ending column
    start, // [5] Start position / Source index
    end // [6] End position
    ]); // Reset offset for the next token

    if (nextOffset) {
      offset = nextOffset;
      nextOffset = null;
    }

    start = end;
  }

  return tokens;
}

/***/ }),

/***/ 3573:
/***/ ((module, exports) => {

"use strict";


exports.__esModule = true;
exports.default = ensureObject;

function ensureObject(obj) {
  for (var _len = arguments.length, props = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    props[_key - 1] = arguments[_key];
  }

  while (props.length > 0) {
    var prop = props.shift();

    if (!obj[prop]) {
      obj[prop] = {};
    }

    obj = obj[prop];
  }
}

module.exports = exports.default;

/***/ }),

/***/ 3514:
/***/ ((module, exports) => {

"use strict";


exports.__esModule = true;
exports.default = getProp;

function getProp(obj) {
  for (var _len = arguments.length, props = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    props[_key - 1] = arguments[_key];
  }

  while (props.length > 0) {
    var prop = props.shift();

    if (!obj[prop]) {
      return undefined;
    }

    obj = obj[prop];
  }

  return obj;
}

module.exports = exports.default;

/***/ }),

/***/ 3621:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";


exports.__esModule = true;
exports.stripComments = exports.ensureObject = exports.getProp = exports.unesc = void 0;

var _unesc = _interopRequireDefault(__nccwpck_require__(2897));

exports.unesc = _unesc["default"];

var _getProp = _interopRequireDefault(__nccwpck_require__(3514));

exports.getProp = _getProp["default"];

var _ensureObject = _interopRequireDefault(__nccwpck_require__(3573));

exports.ensureObject = _ensureObject["default"];

var _stripComments = _interopRequireDefault(__nccwpck_require__(7142));

exports.stripComments = _stripComments["default"];

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/***/ }),

/***/ 7142:
/***/ ((module, exports) => {

"use strict";


exports.__esModule = true;
exports.default = stripComments;

function stripComments(str) {
  var s = "";
  var commentStart = str.indexOf("/*");
  var lastEnd = 0;

  while (commentStart >= 0) {
    s = s + str.slice(lastEnd, commentStart);
    var commentEnd = str.indexOf("*/", commentStart + 2);

    if (commentEnd < 0) {
      return s;
    }

    lastEnd = commentEnd + 2;
    commentStart = str.indexOf("/*", lastEnd);
  }

  s = s + str.slice(lastEnd);
  return s;
}

module.exports = exports.default;

/***/ }),

/***/ 2897:
/***/ ((module, exports) => {

"use strict";


exports.__esModule = true;
exports.default = unesc;

// Many thanks for this post which made this migration much easier.
// https://mathiasbynens.be/notes/css-escapes

/**
 * 
 * @param {string} str 
 * @returns {[string, number]|undefined}
 */
function gobbleHex(str) {
  var lower = str.toLowerCase();
  var hex = '';
  var spaceTerminated = false;

  for (var i = 0; i < 6 && lower[i] !== undefined; i++) {
    var code = lower.charCodeAt(i); // check to see if we are dealing with a valid hex char [a-f|0-9]

    var valid = code >= 97 && code <= 102 || code >= 48 && code <= 57; // https://drafts.csswg.org/css-syntax/#consume-escaped-code-point

    spaceTerminated = code === 32;

    if (!valid) {
      break;
    }

    hex += lower[i];
  }

  if (hex.length === 0) {
    return undefined;
  }

  var codePoint = parseInt(hex, 16);
  var isSurrogate = codePoint >= 0xD800 && codePoint <= 0xDFFF; // Add special case for
  // "If this number is zero, or is for a surrogate, or is greater than the maximum allowed code point"
  // https://drafts.csswg.org/css-syntax/#maximum-allowed-code-point

  if (isSurrogate || codePoint === 0x0000 || codePoint > 0x10FFFF) {
    return ["\uFFFD", hex.length + (spaceTerminated ? 1 : 0)];
  }

  return [String.fromCodePoint(codePoint), hex.length + (spaceTerminated ? 1 : 0)];
}

var CONTAINS_ESCAPE = /\\/;

function unesc(str) {
  var needToProcess = CONTAINS_ESCAPE.test(str);

  if (!needToProcess) {
    return str;
  }

  var ret = "";

  for (var i = 0; i < str.length; i++) {
    if (str[i] === "\\") {
      var gobbled = gobbleHex(str.slice(i + 1, i + 7));

      if (gobbled !== undefined) {
        ret += gobbled[0];
        i += gobbled[1];
        continue;
      } // Retain a pair of \\ if double escaped `\\\\`
      // https://github.com/postcss/postcss-selector-parser/commit/268c9a7656fb53f543dc620aa5b73a30ec3ff20e


      if (str[i + 1] === "\\") {
        ret += "\\";
        i++;
        continue;
      } // if \\ is at the end of the string retain it
      // https://github.com/postcss/postcss-selector-parser/commit/01a6b346e3612ce1ab20219acc26abdc259ccefb


      if (str.length === i + 1) {
        ret += str[i];
      }

      continue;
    }

    ret += str[i];
  }

  return ret;
}

module.exports = exports.default;

/***/ }),

/***/ 9285:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var parse = __nccwpck_require__(5920);
var walk = __nccwpck_require__(9987);
var stringify = __nccwpck_require__(7952);

function ValueParser(value) {
  if (this instanceof ValueParser) {
    this.nodes = parse(value);
    return this;
  }
  return new ValueParser(value);
}

ValueParser.prototype.toString = function() {
  return Array.isArray(this.nodes) ? stringify(this.nodes) : "";
};

ValueParser.prototype.walk = function(cb, bubble) {
  walk(this.nodes, cb, bubble);
  return this;
};

ValueParser.unit = __nccwpck_require__(5148);

ValueParser.walk = walk;

ValueParser.stringify = stringify;

module.exports = ValueParser;


/***/ }),

/***/ 5920:
/***/ ((module) => {

var openParentheses = "(".charCodeAt(0);
var closeParentheses = ")".charCodeAt(0);
var singleQuote = "'".charCodeAt(0);
var doubleQuote = '"'.charCodeAt(0);
var backslash = "\\".charCodeAt(0);
var slash = "/".charCodeAt(0);
var comma = ",".charCodeAt(0);
var colon = ":".charCodeAt(0);
var star = "*".charCodeAt(0);
var uLower = "u".charCodeAt(0);
var uUpper = "U".charCodeAt(0);
var plus = "+".charCodeAt(0);
var isUnicodeRange = /^[a-f0-9?-]+$/i;

module.exports = function(input) {
  var tokens = [];
  var value = input;

  var next,
    quote,
    prev,
    token,
    escape,
    escapePos,
    whitespacePos,
    parenthesesOpenPos;
  var pos = 0;
  var code = value.charCodeAt(pos);
  var max = value.length;
  var stack = [{ nodes: tokens }];
  var balanced = 0;
  var parent;

  var name = "";
  var before = "";
  var after = "";

  while (pos < max) {
    // Whitespaces
    if (code <= 32) {
      next = pos;
      do {
        next += 1;
        code = value.charCodeAt(next);
      } while (code <= 32);
      token = value.slice(pos, next);

      prev = tokens[tokens.length - 1];
      if (code === closeParentheses && balanced) {
        after = token;
      } else if (prev && prev.type === "div") {
        prev.after = token;
      } else if (
        code === comma ||
        code === colon ||
        (code === slash &&
          value.charCodeAt(next + 1) !== star &&
          (!parent ||
            (parent && parent.type === "function" && parent.value !== "calc")))
      ) {
        before = token;
      } else {
        tokens.push({
          type: "space",
          sourceIndex: pos,
          value: token
        });
      }

      pos = next;

      // Quotes
    } else if (code === singleQuote || code === doubleQuote) {
      next = pos;
      quote = code === singleQuote ? "'" : '"';
      token = {
        type: "string",
        sourceIndex: pos,
        quote: quote
      };
      do {
        escape = false;
        next = value.indexOf(quote, next + 1);
        if (~next) {
          escapePos = next;
          while (value.charCodeAt(escapePos - 1) === backslash) {
            escapePos -= 1;
            escape = !escape;
          }
        } else {
          value += quote;
          next = value.length - 1;
          token.unclosed = true;
        }
      } while (escape);
      token.value = value.slice(pos + 1, next);

      tokens.push(token);
      pos = next + 1;
      code = value.charCodeAt(pos);

      // Comments
    } else if (code === slash && value.charCodeAt(pos + 1) === star) {
      token = {
        type: "comment",
        sourceIndex: pos
      };

      next = value.indexOf("*/", pos);
      if (next === -1) {
        token.unclosed = true;
        next = value.length;
      }

      token.value = value.slice(pos + 2, next);
      tokens.push(token);

      pos = next + 2;
      code = value.charCodeAt(pos);

      // Operation within calc
    } else if (
      (code === slash || code === star) &&
      parent &&
      parent.type === "function" &&
      parent.value === "calc"
    ) {
      token = value[pos];
      tokens.push({
        type: "word",
        sourceIndex: pos - before.length,
        value: token
      });
      pos += 1;
      code = value.charCodeAt(pos);

      // Dividers
    } else if (code === slash || code === comma || code === colon) {
      token = value[pos];

      tokens.push({
        type: "div",
        sourceIndex: pos - before.length,
        value: token,
        before: before,
        after: ""
      });
      before = "";

      pos += 1;
      code = value.charCodeAt(pos);

      // Open parentheses
    } else if (openParentheses === code) {
      // Whitespaces after open parentheses
      next = pos;
      do {
        next += 1;
        code = value.charCodeAt(next);
      } while (code <= 32);
      parenthesesOpenPos = pos;
      token = {
        type: "function",
        sourceIndex: pos - name.length,
        value: name,
        before: value.slice(parenthesesOpenPos + 1, next)
      };
      pos = next;

      if (name === "url" && code !== singleQuote && code !== doubleQuote) {
        next -= 1;
        do {
          escape = false;
          next = value.indexOf(")", next + 1);
          if (~next) {
            escapePos = next;
            while (value.charCodeAt(escapePos - 1) === backslash) {
              escapePos -= 1;
              escape = !escape;
            }
          } else {
            value += ")";
            next = value.length - 1;
            token.unclosed = true;
          }
        } while (escape);
        // Whitespaces before closed
        whitespacePos = next;
        do {
          whitespacePos -= 1;
          code = value.charCodeAt(whitespacePos);
        } while (code <= 32);
        if (parenthesesOpenPos < whitespacePos) {
          if (pos !== whitespacePos + 1) {
            token.nodes = [
              {
                type: "word",
                sourceIndex: pos,
                value: value.slice(pos, whitespacePos + 1)
              }
            ];
          } else {
            token.nodes = [];
          }
          if (token.unclosed && whitespacePos + 1 !== next) {
            token.after = "";
            token.nodes.push({
              type: "space",
              sourceIndex: whitespacePos + 1,
              value: value.slice(whitespacePos + 1, next)
            });
          } else {
            token.after = value.slice(whitespacePos + 1, next);
          }
        } else {
          token.after = "";
          token.nodes = [];
        }
        pos = next + 1;
        code = value.charCodeAt(pos);
        tokens.push(token);
      } else {
        balanced += 1;
        token.after = "";
        tokens.push(token);
        stack.push(token);
        tokens = token.nodes = [];
        parent = token;
      }
      name = "";

      // Close parentheses
    } else if (closeParentheses === code && balanced) {
      pos += 1;
      code = value.charCodeAt(pos);

      parent.after = after;
      after = "";
      balanced -= 1;
      stack.pop();
      parent = stack[balanced];
      tokens = parent.nodes;

      // Words
    } else {
      next = pos;
      do {
        if (code === backslash) {
          next += 1;
        }
        next += 1;
        code = value.charCodeAt(next);
      } while (
        next < max &&
        !(
          code <= 32 ||
          code === singleQuote ||
          code === doubleQuote ||
          code === comma ||
          code === colon ||
          code === slash ||
          code === openParentheses ||
          (code === star &&
            parent &&
            parent.type === "function" &&
            parent.value === "calc") ||
          (code === slash &&
            parent.type === "function" &&
            parent.value === "calc") ||
          (code === closeParentheses && balanced)
        )
      );
      token = value.slice(pos, next);

      if (openParentheses === code) {
        name = token;
      } else if (
        (uLower === token.charCodeAt(0) || uUpper === token.charCodeAt(0)) &&
        plus === token.charCodeAt(1) &&
        isUnicodeRange.test(token.slice(2))
      ) {
        tokens.push({
          type: "unicode-range",
          sourceIndex: pos,
          value: token
        });
      } else {
        tokens.push({
          type: "word",
          sourceIndex: pos,
          value: token
        });
      }

      pos = next;
    }
  }

  for (pos = stack.length - 1; pos; pos -= 1) {
    stack[pos].unclosed = true;
  }

  return stack[0].nodes;
};


/***/ }),

/***/ 7952:
/***/ ((module) => {

function stringifyNode(node, custom) {
  var type = node.type;
  var value = node.value;
  var buf;
  var customResult;

  if (custom && (customResult = custom(node)) !== undefined) {
    return customResult;
  } else if (type === "word" || type === "space") {
    return value;
  } else if (type === "string") {
    buf = node.quote || "";
    return buf + value + (node.unclosed ? "" : buf);
  } else if (type === "comment") {
    return "/*" + value + (node.unclosed ? "" : "*/");
  } else if (type === "div") {
    return (node.before || "") + value + (node.after || "");
  } else if (Array.isArray(node.nodes)) {
    buf = stringify(node.nodes, custom);
    if (type !== "function") {
      return buf;
    }
    return (
      value +
      "(" +
      (node.before || "") +
      buf +
      (node.after || "") +
      (node.unclosed ? "" : ")")
    );
  }
  return value;
}

function stringify(nodes, custom) {
  var result, i;

  if (Array.isArray(nodes)) {
    result = "";
    for (i = nodes.length - 1; ~i; i -= 1) {
      result = stringifyNode(nodes[i], custom) + result;
    }
    return result;
  }
  return stringifyNode(nodes, custom);
}

module.exports = stringify;


/***/ }),

/***/ 5148:
/***/ ((module) => {

var minus = "-".charCodeAt(0);
var plus = "+".charCodeAt(0);
var dot = ".".charCodeAt(0);
var exp = "e".charCodeAt(0);
var EXP = "E".charCodeAt(0);

// Check if three code points would start a number
// https://www.w3.org/TR/css-syntax-3/#starts-with-a-number
function likeNumber(value) {
  var code = value.charCodeAt(0);
  var nextCode;

  if (code === plus || code === minus) {
    nextCode = value.charCodeAt(1);

    if (nextCode >= 48 && nextCode <= 57) {
      return true;
    }

    var nextNextCode = value.charCodeAt(2);

    if (nextCode === dot && nextNextCode >= 48 && nextNextCode <= 57) {
      return true;
    }

    return false;
  }

  if (code === dot) {
    nextCode = value.charCodeAt(1);

    if (nextCode >= 48 && nextCode <= 57) {
      return true;
    }

    return false;
  }

  if (code >= 48 && code <= 57) {
    return true;
  }

  return false;
}

// Consume a number
// https://www.w3.org/TR/css-syntax-3/#consume-number
module.exports = function(value) {
  var pos = 0;
  var length = value.length;
  var code;
  var nextCode;
  var nextNextCode;

  if (length === 0 || !likeNumber(value)) {
    return false;
  }

  code = value.charCodeAt(pos);

  if (code === plus || code === minus) {
    pos++;
  }

  while (pos < length) {
    code = value.charCodeAt(pos);

    if (code < 48 || code > 57) {
      break;
    }

    pos += 1;
  }

  code = value.charCodeAt(pos);
  nextCode = value.charCodeAt(pos + 1);

  if (code === dot && nextCode >= 48 && nextCode <= 57) {
    pos += 2;

    while (pos < length) {
      code = value.charCodeAt(pos);

      if (code < 48 || code > 57) {
        break;
      }

      pos += 1;
    }
  }

  code = value.charCodeAt(pos);
  nextCode = value.charCodeAt(pos + 1);
  nextNextCode = value.charCodeAt(pos + 2);

  if (
    (code === exp || code === EXP) &&
    ((nextCode >= 48 && nextCode <= 57) ||
      ((nextCode === plus || nextCode === minus) &&
        nextNextCode >= 48 &&
        nextNextCode <= 57))
  ) {
    pos += nextCode === plus || nextCode === minus ? 3 : 2;

    while (pos < length) {
      code = value.charCodeAt(pos);

      if (code < 48 || code > 57) {
        break;
      }

      pos += 1;
    }
  }

  return {
    number: value.slice(0, pos),
    unit: value.slice(pos)
  };
};


/***/ }),

/***/ 9987:
/***/ ((module) => {

module.exports = function walk(nodes, cb, bubble) {
  var i, max, node, result;

  for (i = 0, max = nodes.length; i < max; i += 1) {
    node = nodes[i];
    if (!bubble) {
      result = cb(node, i, nodes);
    }

    if (
      result !== false &&
      node.type === "function" &&
      Array.isArray(node.nodes)
    ) {
      walk(node.nodes, cb, bubble);
    }

    if (bubble) {
      cb(node, i, nodes);
    }
  }
};


/***/ }),

/***/ 5278:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {


/**
 * For Node.js, simply re-export the core `util.deprecate` function.
 */

module.exports = __nccwpck_require__(1669).deprecate;


/***/ }),

/***/ 4091:
/***/ ((module) => {

"use strict";

module.exports = function (Yallist) {
  Yallist.prototype[Symbol.iterator] = function* () {
    for (let walker = this.head; walker; walker = walker.next) {
      yield walker.value
    }
  }
}


/***/ }),

/***/ 665:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";

module.exports = Yallist

Yallist.Node = Node
Yallist.create = Yallist

function Yallist (list) {
  var self = this
  if (!(self instanceof Yallist)) {
    self = new Yallist()
  }

  self.tail = null
  self.head = null
  self.length = 0

  if (list && typeof list.forEach === 'function') {
    list.forEach(function (item) {
      self.push(item)
    })
  } else if (arguments.length > 0) {
    for (var i = 0, l = arguments.length; i < l; i++) {
      self.push(arguments[i])
    }
  }

  return self
}

Yallist.prototype.removeNode = function (node) {
  if (node.list !== this) {
    throw new Error('removing node which does not belong to this list')
  }

  var next = node.next
  var prev = node.prev

  if (next) {
    next.prev = prev
  }

  if (prev) {
    prev.next = next
  }

  if (node === this.head) {
    this.head = next
  }
  if (node === this.tail) {
    this.tail = prev
  }

  node.list.length--
  node.next = null
  node.prev = null
  node.list = null

  return next
}

Yallist.prototype.unshiftNode = function (node) {
  if (node === this.head) {
    return
  }

  if (node.list) {
    node.list.removeNode(node)
  }

  var head = this.head
  node.list = this
  node.next = head
  if (head) {
    head.prev = node
  }

  this.head = node
  if (!this.tail) {
    this.tail = node
  }
  this.length++
}

Yallist.prototype.pushNode = function (node) {
  if (node === this.tail) {
    return
  }

  if (node.list) {
    node.list.removeNode(node)
  }

  var tail = this.tail
  node.list = this
  node.prev = tail
  if (tail) {
    tail.next = node
  }

  this.tail = node
  if (!this.head) {
    this.head = node
  }
  this.length++
}

Yallist.prototype.push = function () {
  for (var i = 0, l = arguments.length; i < l; i++) {
    push(this, arguments[i])
  }
  return this.length
}

Yallist.prototype.unshift = function () {
  for (var i = 0, l = arguments.length; i < l; i++) {
    unshift(this, arguments[i])
  }
  return this.length
}

Yallist.prototype.pop = function () {
  if (!this.tail) {
    return undefined
  }

  var res = this.tail.value
  this.tail = this.tail.prev
  if (this.tail) {
    this.tail.next = null
  } else {
    this.head = null
  }
  this.length--
  return res
}

Yallist.prototype.shift = function () {
  if (!this.head) {
    return undefined
  }

  var res = this.head.value
  this.head = this.head.next
  if (this.head) {
    this.head.prev = null
  } else {
    this.tail = null
  }
  this.length--
  return res
}

Yallist.prototype.forEach = function (fn, thisp) {
  thisp = thisp || this
  for (var walker = this.head, i = 0; walker !== null; i++) {
    fn.call(thisp, walker.value, i, this)
    walker = walker.next
  }
}

Yallist.prototype.forEachReverse = function (fn, thisp) {
  thisp = thisp || this
  for (var walker = this.tail, i = this.length - 1; walker !== null; i--) {
    fn.call(thisp, walker.value, i, this)
    walker = walker.prev
  }
}

Yallist.prototype.get = function (n) {
  for (var i = 0, walker = this.head; walker !== null && i < n; i++) {
    // abort out of the list early if we hit a cycle
    walker = walker.next
  }
  if (i === n && walker !== null) {
    return walker.value
  }
}

Yallist.prototype.getReverse = function (n) {
  for (var i = 0, walker = this.tail; walker !== null && i < n; i++) {
    // abort out of the list early if we hit a cycle
    walker = walker.prev
  }
  if (i === n && walker !== null) {
    return walker.value
  }
}

Yallist.prototype.map = function (fn, thisp) {
  thisp = thisp || this
  var res = new Yallist()
  for (var walker = this.head; walker !== null;) {
    res.push(fn.call(thisp, walker.value, this))
    walker = walker.next
  }
  return res
}

Yallist.prototype.mapReverse = function (fn, thisp) {
  thisp = thisp || this
  var res = new Yallist()
  for (var walker = this.tail; walker !== null;) {
    res.push(fn.call(thisp, walker.value, this))
    walker = walker.prev
  }
  return res
}

Yallist.prototype.reduce = function (fn, initial) {
  var acc
  var walker = this.head
  if (arguments.length > 1) {
    acc = initial
  } else if (this.head) {
    walker = this.head.next
    acc = this.head.value
  } else {
    throw new TypeError('Reduce of empty list with no initial value')
  }

  for (var i = 0; walker !== null; i++) {
    acc = fn(acc, walker.value, i)
    walker = walker.next
  }

  return acc
}

Yallist.prototype.reduceReverse = function (fn, initial) {
  var acc
  var walker = this.tail
  if (arguments.length > 1) {
    acc = initial
  } else if (this.tail) {
    walker = this.tail.prev
    acc = this.tail.value
  } else {
    throw new TypeError('Reduce of empty list with no initial value')
  }

  for (var i = this.length - 1; walker !== null; i--) {
    acc = fn(acc, walker.value, i)
    walker = walker.prev
  }

  return acc
}

Yallist.prototype.toArray = function () {
  var arr = new Array(this.length)
  for (var i = 0, walker = this.head; walker !== null; i++) {
    arr[i] = walker.value
    walker = walker.next
  }
  return arr
}

Yallist.prototype.toArrayReverse = function () {
  var arr = new Array(this.length)
  for (var i = 0, walker = this.tail; walker !== null; i++) {
    arr[i] = walker.value
    walker = walker.prev
  }
  return arr
}

Yallist.prototype.slice = function (from, to) {
  to = to || this.length
  if (to < 0) {
    to += this.length
  }
  from = from || 0
  if (from < 0) {
    from += this.length
  }
  var ret = new Yallist()
  if (to < from || to < 0) {
    return ret
  }
  if (from < 0) {
    from = 0
  }
  if (to > this.length) {
    to = this.length
  }
  for (var i = 0, walker = this.head; walker !== null && i < from; i++) {
    walker = walker.next
  }
  for (; walker !== null && i < to; i++, walker = walker.next) {
    ret.push(walker.value)
  }
  return ret
}

Yallist.prototype.sliceReverse = function (from, to) {
  to = to || this.length
  if (to < 0) {
    to += this.length
  }
  from = from || 0
  if (from < 0) {
    from += this.length
  }
  var ret = new Yallist()
  if (to < from || to < 0) {
    return ret
  }
  if (from < 0) {
    from = 0
  }
  if (to > this.length) {
    to = this.length
  }
  for (var i = this.length, walker = this.tail; walker !== null && i > to; i--) {
    walker = walker.prev
  }
  for (; walker !== null && i > from; i--, walker = walker.prev) {
    ret.push(walker.value)
  }
  return ret
}

Yallist.prototype.splice = function (start, deleteCount, ...nodes) {
  if (start > this.length) {
    start = this.length - 1
  }
  if (start < 0) {
    start = this.length + start;
  }

  for (var i = 0, walker = this.head; walker !== null && i < start; i++) {
    walker = walker.next
  }

  var ret = []
  for (var i = 0; walker && i < deleteCount; i++) {
    ret.push(walker.value)
    walker = this.removeNode(walker)
  }
  if (walker === null) {
    walker = this.tail
  }

  if (walker !== this.head && walker !== this.tail) {
    walker = walker.prev
  }

  for (var i = 0; i < nodes.length; i++) {
    walker = insert(this, walker, nodes[i])
  }
  return ret;
}

Yallist.prototype.reverse = function () {
  var head = this.head
  var tail = this.tail
  for (var walker = head; walker !== null; walker = walker.prev) {
    var p = walker.prev
    walker.prev = walker.next
    walker.next = p
  }
  this.head = tail
  this.tail = head
  return this
}

function insert (self, node, value) {
  var inserted = node === self.head ?
    new Node(value, null, node, self) :
    new Node(value, node, node.next, self)

  if (inserted.next === null) {
    self.tail = inserted
  }
  if (inserted.prev === null) {
    self.head = inserted
  }

  self.length++

  return inserted
}

function push (self, item) {
  self.tail = new Node(item, self.tail, null, self)
  if (!self.head) {
    self.head = self.tail
  }
  self.length++
}

function unshift (self, item) {
  self.head = new Node(item, null, self.head, self)
  if (!self.tail) {
    self.tail = self.head
  }
  self.length++
}

function Node (value, prev, next, list) {
  if (!(this instanceof Node)) {
    return new Node(value, prev, next, list)
  }

  this.list = list
  this.value = value

  if (prev) {
    prev.next = this
    this.prev = prev
  } else {
    this.prev = null
  }

  if (next) {
    next.prev = this
    this.next = next
  } else {
    this.next = null
  }
}

try {
  // add if support for Symbol.iterator is present
  __nccwpck_require__(4091)(Yallist)
} catch (er) {}


/***/ }),

/***/ 8735:
/***/ ((module) => {

"use strict";
module.exports = JSON.parse('{"additionalProperties":false,"properties":{"url":{"description":"Enables/Disables \'url\'/\'image-set\' functions handling (https://github.com/webpack-contrib/css-loader#url).","anyOf":[{"type":"boolean"},{"instanceof":"Function"}]},"import":{"description":"Enables/Disables \'@import\' at-rules handling (https://github.com/webpack-contrib/css-loader#import).","anyOf":[{"type":"boolean"},{"instanceof":"Function"}]},"modules":{"description":"Enables/Disables CSS Modules and their configuration (https://github.com/webpack-contrib/css-loader#modules).","anyOf":[{"type":"boolean"},{"enum":["local","global","pure"]},{"type":"object","additionalProperties":false,"properties":{"compileType":{"description":"Controls the extent to which css-loader will process module code (https://github.com/webpack-contrib/css-loader#type)","enum":["module","icss"]},"auto":{"description":"Allows auto enable CSS modules based on filename (https://github.com/webpack-contrib/css-loader#auto).","anyOf":[{"instanceof":"RegExp"},{"instanceof":"Function"},{"type":"boolean"}]},"mode":{"description":"Setup `mode` option (https://github.com/webpack-contrib/css-loader#mode).","anyOf":[{"enum":["local","global","pure"]},{"instanceof":"Function"}]},"localIdentName":{"description":"Allows to configure the generated local ident name (https://github.com/webpack-contrib/css-loader#localidentname).","type":"string","minLength":1},"localIdentContext":{"description":"Allows to redefine basic loader context for local ident name (https://github.com/webpack-contrib/css-loader#localidentcontext).","type":"string","minLength":1},"localIdentHashPrefix":{"description":"Allows to add custom hash to generate more unique classes (https://github.com/webpack-contrib/css-loader#localidenthashprefix).","type":"string","minLength":1},"localIdentRegExp":{"description":"Allows to specify custom RegExp for local ident name (https://github.com/webpack-contrib/css-loader#localidentregexp).","anyOf":[{"type":"string","minLength":1},{"instanceof":"RegExp"}]},"getLocalIdent":{"description":"Allows to specify a function to generate the classname (https://github.com/webpack-contrib/css-loader#getlocalident).","instanceof":"Function"},"namedExport":{"description":"Enables/disables ES modules named export for locals (https://github.com/webpack-contrib/css-loader#namedexport).","type":"boolean"},"exportGlobals":{"description":"Allows to export names from global class or id, so you can use that as local name (https://github.com/webpack-contrib/css-loader#exportglobals).","type":"boolean"},"exportLocalsConvention":{"description":"Style of exported classnames (https://github.com/webpack-contrib/css-loader#localsconvention).","enum":["asIs","camelCase","camelCaseOnly","dashes","dashesOnly"]},"exportOnlyLocals":{"description":"Export only locals (https://github.com/webpack-contrib/css-loader#exportonlylocals).","type":"boolean"}}}]},"sourceMap":{"description":"Enables/Disables generation of source maps (https://github.com/webpack-contrib/css-loader#sourcemap).","type":"boolean"},"importLoaders":{"description":"Enables/Disables or setups number of loaders applied before CSS loader (https://github.com/webpack-contrib/css-loader#importloaders).","anyOf":[{"type":"boolean"},{"type":"string"},{"type":"integer"}]},"esModule":{"description":"Use the ES modules syntax (https://github.com/webpack-contrib/css-loader#esmodule).","type":"boolean"}},"type":"object"}');

/***/ }),

/***/ 4698:
/***/ ((module) => {

"use strict";
module.exports = JSON.parse('{"_from":"postcss@^8.3.6","_id":"postcss@8.3.7","_inBundle":false,"_integrity":"sha512-9SaY7nnyQ63/WittqZYAvkkYPyKxchMKH71UDzeTmWuLSvxTRpeEeABZAzlCi55cuGcoFyoV/amX2BdsafQidQ==","_location":"/postcss","_phantomChildren":{},"_requested":{"type":"range","registry":true,"raw":"postcss@^8.3.6","name":"postcss","escapedName":"postcss","rawSpec":"^8.3.6","saveSpec":null,"fetchSpec":"^8.3.6"},"_requiredBy":["/","/css-loader","/postcss-js","/sugarss"],"_resolved":"https://registry.npmjs.org/postcss/-/postcss-8.3.7.tgz","_shasum":"ec88563588c8da8e58e7226f7633b51ae221eeda","_spec":"postcss@^8.3.6","_where":"/home/nicholas_io/projects/10up-toolkit/packages/toolkit","author":{"name":"Andrey Sitnik","email":"andrey@sitnik.ru"},"browser":{"./lib/terminal-highlight":false,"source-map-js":false,"path":false,"url":false,"fs":false},"bugs":{"url":"https://github.com/postcss/postcss/issues"},"bundleDependencies":false,"dependencies":{"nanocolors":"^0.1.5","nanoid":"^3.1.25","source-map-js":"^0.6.2"},"deprecated":false,"description":"Tool for transforming styles with JS plugins","engines":{"node":"^10 || ^12 || >=14"},"exports":{".":{"require":"./lib/postcss.js","import":"./lib/postcss.mjs","types":"./lib/postcss.d.ts"},"./lib/at-rule":"./lib/at-rule.js","./lib/comment":"./lib/comment.js","./lib/container":"./lib/container.js","./lib/css-syntax-error":"./lib/css-syntax-error.js","./lib/declaration":"./lib/declaration.js","./lib/fromJSON":"./lib/fromJSON.js","./lib/input":"./lib/input.js","./lib/lazy-result":"./lib/lazy-result.js","./lib/list":"./lib/list.js","./lib/map-generator":"./lib/map-generator.js","./lib/node":"./lib/node.js","./lib/parse":"./lib/parse.js","./lib/parser":"./lib/parser.js","./lib/postcss":"./lib/postcss.js","./lib/previous-map":"./lib/previous-map.js","./lib/processor":"./lib/processor.js","./lib/result":"./lib/result.js","./lib/root":"./lib/root.js","./lib/rule":"./lib/rule.js","./lib/stringifier":"./lib/stringifier.js","./lib/stringify":"./lib/stringify.js","./lib/symbols":"./lib/symbols.js","./lib/terminal-highlight":"./lib/terminal-highlight.js","./lib/tokenize":"./lib/tokenize.js","./lib/warn-once":"./lib/warn-once.js","./lib/warning":"./lib/warning.js","./package.json":"./package.json"},"funding":{"type":"opencollective","url":"https://opencollective.com/postcss/"},"homepage":"https://postcss.org/","keywords":["css","postcss","rework","preprocessor","parser","source map","transform","manipulation","transpiler"],"license":"MIT","main":"./lib/postcss.js","name":"postcss","repository":{"type":"git","url":"git+https://github.com/postcss/postcss.git"},"types":"./lib/postcss.d.ts","version":"8.3.7"}');

/***/ }),

/***/ 3339:
/***/ ((module) => {

"use strict";
module.exports = require("../../compiled/schema-utils");

/***/ }),

/***/ 6417:
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ 5622:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ 2043:
/***/ ((module) => {

"use strict";
module.exports = require("postcss");

/***/ }),

/***/ 8835:
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ }),

/***/ 1669:
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId].call(module.exports, module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __nccwpck_require__(7583);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;