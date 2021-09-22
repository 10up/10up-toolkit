/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 738:
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

/***/ 887:
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

/***/ 904:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const parse = __nccwpck_require__(583)
const stringify = __nccwpck_require__(749)

const JSON5 = {
    parse,
    stringify,
}

module.exports = JSON5


/***/ }),

/***/ 583:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const util = __nccwpck_require__(393)

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

const util = __nccwpck_require__(393)

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

/***/ 927:
/***/ ((module) => {

// This is a generated file. Do not edit.
module.exports.Space_Separator = /[\u1680\u2000-\u200A\u202F\u205F\u3000]/
module.exports.ID_Start = /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312E\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEA\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF19]|\uD806[\uDCA0-\uDCDF\uDCFF\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE83\uDE86-\uDE89\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]/
module.exports.ID_Continue = /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u08D4-\u08E1\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u09FC\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9-\u0AFF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C80-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D00-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D54-\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1C80-\u1C88\u1CD0-\u1CD2\u1CD4-\u1CF9\u1D00-\u1DF9\u1DFB-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312E\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEA\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDCA-\uDDCC\uDDD0-\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE37\uDE3E\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC00-\uDC4A\uDC50-\uDC59\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDDD8-\uDDDD\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9\uDF00-\uDF19\uDF1D-\uDF2B\uDF30-\uDF39]|\uD806[\uDCA0-\uDCE9\uDCFF\uDE00-\uDE3E\uDE47\uDE50-\uDE83\uDE86-\uDE99\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC36\uDC38-\uDC40\uDC50-\uDC59\uDC72-\uDC8F\uDC92-\uDCA7\uDCA9-\uDCB6\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD36\uDD3A\uDD3C\uDD3D\uDD3F-\uDD47\uDD50-\uDD59]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6\uDD00-\uDD4A\uDD50-\uDD59]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/


/***/ }),

/***/ 393:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const unicode = __nccwpck_require__(927)

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

/***/ 821:
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

/***/ 567:
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
  const Big = __nccwpck_require__(738);

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

  const hash = __nccwpck_require__(417).createHash(hashType);

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

/***/ 445:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


const parseQuery = __nccwpck_require__(867);

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

/***/ 715:
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

/***/ 432:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";


const getOptions = __nccwpck_require__(445);
const parseQuery = __nccwpck_require__(867);
const stringifyRequest = __nccwpck_require__(252);
const getRemainingRequest = __nccwpck_require__(715);
const getCurrentRequest = __nccwpck_require__(821);
const isUrlRequest = __nccwpck_require__(507);
const urlToRequest = __nccwpck_require__(685);
const parseString = __nccwpck_require__(784);
const getHashDigest = __nccwpck_require__(567);
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


const path = __nccwpck_require__(622);
const emojisList = __nccwpck_require__(887);
const getHashDigest = __nccwpck_require__(567);

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


const path = __nccwpck_require__(622);

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

/***/ 867:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


const JSON5 = __nccwpck_require__(904);

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

/***/ 784:
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

/***/ 252:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


const path = __nccwpck_require__(622);

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

/***/ 685:
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

/***/ 117:
/***/ (function(__unused_webpack_module, exports) {

(function(global, factory) {
  /*jshint -W030 */
  'use strict';
   true
    ? factory(exports)
    : 0;
})(this, function(exports) {
  'use strict';

  var noop = function noop() {};
  var throwError = function throwError() {
    throw new Error('Callback was already called.');
  };

  var DEFAULT_TIMES = 5;
  var DEFAULT_INTERVAL = 0;

  var obj = 'object';
  var func = 'function';
  var isArray = Array.isArray;
  var nativeKeys = Object.keys;
  var nativePush = Array.prototype.push;
  var iteratorSymbol = typeof Symbol === func && Symbol.iterator;

  var nextTick, asyncNextTick, asyncSetImmediate;
  createImmediate();

  /**
   * @memberof async
   * @namespace each
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done();
   *   }, num * 10);
   * };
   * async.each(array, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done();
   *   }, num * 10);
   * };
   * async.each(array, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [[1, 0], [2, 2], [3, 1]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done();
   *   }, num * 10);
   * };
   * async.each(object, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done();
   *   }, num * 10);
   * };
   * async.each(object, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [[1, 'a'], [2, 'c'], [3, 'b']]
   * });
   *
   * @example
   *
   * // break
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num !== 2);
   *   }, num * 10);
   * };
   * async.each(array, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [1, 2]
   * });
   *
   */
  var each = createEach(arrayEach, baseEach, symbolEach);

  /**
   * @memberof async
   * @namespace map
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.map(array, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2];
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.map(array, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2]
   *   console.log(order); // [[1, 0], [2, 2], [3, 1]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.map(object, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2]
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.map(object, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2]
   *   console.log(order); // [[1, 'a'], [2, 'c'], [3, 'b']]
   * });
   *
   */
  var map = createMap(arrayEachIndex, baseEachIndex, symbolEachIndex, true);

  /**
   * @memberof async
   * @namespace mapValues
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValues(array, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 3, '2': 2 }
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValues(array, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 3, '2': 2 }
   *   console.log(order); // [[1, 0], [2, 2], [3, 1]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValues(object, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 3, c: 2 }
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValues(object, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 3, c: 2 }
   *   console.log(order); // [[1, 'a'], [2, 'c'], [3, 'b']]
   * });
   *
   */
  var mapValues = createMap(arrayEachIndex, baseEachKey, symbolEachKey, false);

  /**
   * @memberof async
   * @namespace filter
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filter(array, iterator, function(err, res) {
   *   console.log(res); // [1, 3];
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filter(array, iterator, function(err, res) {
   *   console.log(res); // [1, 3];
   *   console.log(order); // [[1, 0], [2, 2], [3, 1]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filter(object, iterator, function(err, res) {
   *   console.log(res); // [1, 3];
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filter(object, iterator, function(err, res) {
   *   console.log(res); // [1, 3];
   *   console.log(order); // [[1, 'a'], [2, 'c'], [3, 'b']]
   * });
   *
   */
  var filter = createFilter(arrayEachIndexValue, baseEachIndexValue, symbolEachIndexValue, true);

  /**
   * @memberof async
   * @namespace filterSeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filterSeries(array, iterator, function(err, res) {
   *   console.log(res); // [1, 3];
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filterSeries(array, iterator, function(err, res) {
   *   console.log(res); // [1, 3]
   *   console.log(order); // [[1, 0], [3, 1], [2, 2]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filterSeries(object, iterator, function(err, res) {
   *   console.log(res); // [1, 3]
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filterSeries(object, iterator, function(err, res) {
   *   console.log(res); // [1, 3]
   *   console.log(order); // [[1, 'a'], [3, 'b'], [2, 'c']]
   * });
   *
   */
  var filterSeries = createFilterSeries(true);

  /**
   * @memberof async
   * @namespace filterLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filterLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 5, 3]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filterLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 5, 3]
   *   console.log(order); // [[1, 0], [3, 2], [5, 1], [2, 4], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filterLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 5, 3]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filterLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 5, 3]
   *   console.log(order); // [[1, 'a'], [3, 'c'], [5, 'b'], [2, 'e'], [4, 'd']]
   * });
   *
   */
  var filterLimit = createFilterLimit(true);

  /**
   * @memberof async
   * @namespace reject
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.reject(array, iterator, function(err, res) {
   *   console.log(res); // [2];
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.reject(array, iterator, function(err, res) {
   *   console.log(res); // [2];
   *   console.log(order); // [[1, 0], [2, 2], [3, 1]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.reject(object, iterator, function(err, res) {
   *   console.log(res); // [2];
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.reject(object, iterator, function(err, res) {
   *   console.log(res); // [2];
   *   console.log(order); // [[1, 'a'], [2, 'c'], [3, 'b']]
   * });
   *
   */
  var reject = createFilter(arrayEachIndexValue, baseEachIndexValue, symbolEachIndexValue, false);

  /**
   * @memberof async
   * @namespace rejectSeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.rejectSeries(array, iterator, function(err, res) {
   *   console.log(res); // [2];
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.rejectSeries(object, iterator, function(err, res) {
   *   console.log(res); // [2];
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.rejectSeries(object, iterator, function(err, res) {
   *   console.log(res); // [2];
   *   console.log(order); // [[1, 'a'], [3, 'b'], [2, 'c']]
   * });
   *
   */
  var rejectSeries = createFilterSeries(false);

  /**
   * @memberof async
   * @namespace rejectLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.rejectLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // [4, 2]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.rejectLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // [4, 2]
   *   console.log(order); // [[1, 0], [3, 2], [5, 1], [2, 4], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.rejectLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // [4, 2]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.rejectLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // [4, 2]
   *   console.log(order); // [[1, 'a'], [3, 'c'], [5, 'b'], [2, 'e'], [4, 'd']]
   * });
   *
   */
  var rejectLimit = createFilterLimit(false);

  /**
   * @memberof async
   * @namespace detect
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detect(array, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detect(array, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [[1, 0]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detect(object, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detect(object, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [[1, 'a']]
   * });
   *
   */
  var detect = createDetect(arrayEachValue, baseEachValue, symbolEachValue, true);

  /**
   * @memberof async
   * @namespace detectSeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detectSeries(array, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detectSeries(array, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [[1, 0]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detectSeries(object, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detectSeries(object, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [[1, 'a']]
   * });
   *
   */
  var detectSeries = createDetectSeries(true);

  /**
   * @memberof async
   * @namespace detectLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detectLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detectLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [[1, 0]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detectLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detectLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [[1, 'a']]
   * });
   *
   */
  var detectLimit = createDetectLimit(true);

  /**
   * @memberof async
   * @namespace every
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.every(array, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [1, 2]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.every(array, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [[1, 0], [2, 2]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.every(object, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [1, 2]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.every(object, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [[1, 'a'], [2, 'c']]
   * });
   *
   */
  var every = createEvery(arrayEachValue, baseEachValue, symbolEachValue);

  /**
   * @memberof async
   * @namespace everySeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.everySeries(array, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.everySeries(array, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [[1, 0], [3, 1], [2, 2]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.everySeries(object, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.everySeries(object, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [[1, 'a'], [3, 'b'] [2, 'c']]
   * });
   *
   */
  var everySeries = createEverySeries();

  /**
   * @memberof async
   * @namespace everyLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.everyLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [1, 3, 5, 2]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.everyLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [[1, 0], [3, 2], [5, 1], [2, 4]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.everyLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [1, 3, 5, 2]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.everyLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [[1, 'a'], [3, 'c'], [5, 'b'], [2, 'e']]
   * });
   *
   */
  var everyLimit = createEveryLimit();

  /**
   * @memberof async
   * @namespace pick
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2, 4];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pick(array, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 3 }
   *   console.log(order); // [1, 2, 3, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2, 4];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pick(array, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 3 }
   *   console.log(order); // [[0, 1], [2, 2], [3, 1], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pick(object, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 3 }
   *   console.log(order); // [1, 2, 3, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pick(object, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 3 }
   *   console.log(order); // [[1, 'a'], [2, 'c'], [3, 'b'], [4, 'd']]
   * });
   *
   */
  var pick = createPick(arrayEachIndexValue, baseEachKeyValue, symbolEachKeyValue, true);

  /**
   * @memberof async
   * @namespace pickSeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2, 4];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pickSeries(array, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 3 }
   *   console.log(order); // [1, 3, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2, 4];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pickSeries(array, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 3 }
   *   console.log(order); // [[0, 1], [3, 1], [2, 2], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pickSeries(object, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 3 }
   *   console.log(order); // [1, 3, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pickSeries(object, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 3 }
   *   console.log(order); // [[1, 'a'], [3, 'b'], [2, 'c'], [4, 'd']]
   * });
   *
   */
  var pickSeries = createPickSeries(true);

  /**
   * @memberof async
   * @namespace pickLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pickLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 5, '2': 3 }
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pickLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 5, '2': 3 }
   *   console.log(order); // [[1, 0], [3, 2], [5, 1], [2, 4], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pickLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 5, c: 3 }
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pickLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 5, c: 3 }
   *   console.log(order); // [[1, 'a'], [3, 'c'], [5, 'b'], [2, 'e'], [4, 'd']]
   * });
   *
   */
  var pickLimit = createPickLimit(true);

  /**
   * @memberof async
   * @namespace omit
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2, 4];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omit(array, iterator, function(err, res) {
   *   console.log(res); // { '2': 2, '3': 4 }
   *   console.log(order); // [1, 2, 3, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2, 4];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omit(array, iterator, function(err, res) {
   *   console.log(res); // { '2': 2, '3': 4 }
   *   console.log(order); // [[0, 1], [2, 2], [3, 1], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omit(object, iterator, function(err, res) {
   *   console.log(res); // { c: 2, d: 4 }
   *   console.log(order); // [1, 2, 3, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omit(object, iterator, function(err, res) {
   *   console.log(res); // { c: 2, d: 4 }
   *   console.log(order); // [[1, 'a'], [2, 'c'], [3, 'b'], [4, 'd']]
   * });
   *
   */
  var omit = createPick(arrayEachIndexValue, baseEachKeyValue, symbolEachKeyValue, false);

  /**
   * @memberof async
   * @namespace omitSeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2, 4];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omitSeries(array, iterator, function(err, res) {
   *   console.log(res); // { '2': 2, '3': 4 }
   *   console.log(order); // [1, 3, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2, 4];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omitSeries(array, iterator, function(err, res) {
   *   console.log(res); // { '2': 2, '3': 4 }
   *   console.log(order); // [[0, 1], [3, 1], [2, 2], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omitSeries(object, iterator, function(err, res) {
   *   console.log(res); // { c: 2, d: 4 }
   *   console.log(order); // [1, 3, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omitSeries(object, iterator, function(err, res) {
   *   console.log(res); // { c: 2, d: 4 }
   *   console.log(order); // [[1, 'a'], [3, 'b'], [2, 'c'], [4, 'd']]
   * });
   *
   */
  var omitSeries = createPickSeries(false);

  /**
   * @memberof async
   * @namespace omitLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omitLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // { '3': 4, '4': 2 }
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omitLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // { '3': 4, '4': 2 }
   *   console.log(order); // [[1, 0], [3, 2], [5, 1], [2, 4], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omitLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // { d: 4, e: 2 }
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omitLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // { d: 4, e: 2 }
   *   console.log(order); // [[1, 'a'], [3, 'c'], [5, 'b'], [2, 'e'], [4, 'd']]
   * });
   *
   */
  var omitLimit = createPickLimit(false);

  /**
   * @memberof async
   * @namespace transform
   * @param {Array|Object} collection
   * @param {Array|Object|Function} [accumulator]
   * @param {Function} [iterator]
   * @param {Function} [callback]
   * @example
   *
   * // array
   * var order = [];
   * var collection = [1, 3, 2, 4];
   * var iterator = function(result, num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     result.push(num)
   *     done();
   *   }, num * 10);
   * };
   * async.transform(collection, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3, 4]
   *   console.log(order); // [1, 2, 3, 4]
   * });
   *
   * @example
   *
   * // array with index and accumulator
   * var order = [];
   * var collection = [1, 3, 2, 4];
   * var iterator = function(result, num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     result[index] = num;
   *     done();
   *   }, num * 10);
   * };
   * async.transform(collection, {}, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 3, '2': 2, '3': 4 }
   *   console.log(order); // [[1, 0], [2, 2], [3, 1], [4, 3]]
   * });
   *
   * @example
   *
   * // object with accumulator
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(result, num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     result.push(num);
   *     done();
   *   }, num * 10);
   * };
   * async.transform(collection, [], iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3, 4]
   *   console.log(order); // [1, 2, 3, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(result, num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     result[key] = num;
   *     done();
   *   }, num * 10);
   * };
   * async.transform(collection, iterator, function(err, res) {
   *   console.log(res); //  { a: 1, b: 3, c: 2, d: 4 }
   *   console.log(order); // [[1, 'a'], [2, 'c'], [3, 'b'], [4, 'd']]
   * });
   *
   */
  var transform = createTransform(arrayEachResult, baseEachResult, symbolEachResult);

  /**
   * @memberof async
   * @namespace sortBy
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortBy(array, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3];
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortBy(array, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3]
   *   console.log(order); // [[1, 0], [2, 2], [3, 1]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortBy(object, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3]
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortBy(object, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3]
   *   console.log(order); // [[1, 'a'], [2, 'c'], [3, 'b']]
   * });
   *
   */
  var sortBy = createSortBy(arrayEachIndexValue, baseEachIndexValue, symbolEachIndexValue);

  /**
   * @memberof async
   * @namespace concat
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, [num]);
   *   }, num * 10);
   * };
   * async.concat(array, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3];
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, [num]);
   *   }, num * 10);
   * };
   * async.concat(array, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3]
   *   console.log(order); // [[1, 0], [2, 2], [3, 1]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, [num]);
   *   }, num * 10);
   * };
   * async.concat(object, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3]
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, [num]);
   *   }, num * 10);
   * };
   * async.concat(object, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3]
   *   console.log(order); // [[1, 'a'], [2, 'c'], [3, 'b']]
   * });
   *
   */
  var concat = createConcat(arrayEachIndex, baseEachIndex, symbolEachIndex);

  /**
   * @memberof async
   * @namespace groupBy
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [4.2, 6.4, 6.1];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupBy(array, iterator, function(err, res) {
   *   console.log(res); // { '4': [4.2], '6': [6.1, 6.4] }
   *   console.log(order); // [4.2, 6.1, 6.4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [4.2, 6.4, 6.1];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupBy(array, iterator, function(err, res) {
   *   console.log(res); // { '4': [4.2], '6': [6.1, 6.4] }
   *   console.log(order); // [[4.2, 0], [6.1, 2], [6.4, 1]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 4.2, b: 6.4, c: 6.1 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupBy(object, iterator, function(err, res) {
   *   console.log(res); // { '4': [4.2], '6': [6.1, 6.4] }
   *   console.log(order); // [4.2, 6.1, 6.4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 4.2, b: 6.4, c: 6.1 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupBy(object, iterator, function(err, res) {
   *   console.log(res); // { '4': [4.2], '6': [6.1, 6.4] }
   *   console.log(order); // [[4.2, 'a'], [6.1, 'c'], [6.4, 'b']]
   * });
   *
   */
  var groupBy = createGroupBy(arrayEachValue, baseEachValue, symbolEachValue);

  /**
   * @memberof async
   * @namespace parallel
   * @param {Array|Object} tasks - functions
   * @param {Function} callback
   * @example
   *
   * var order = [];
   * var tasks = [
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(1);
   *      done(null, 1);
   *    }, 10);
   *  },
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(2);
   *      done(null, 2);
   *    }, 30);
   *  },
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(3);
   *      done(null, 3);
   *    }, 40);
   *  },
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(4);
   *      done(null, 4);
   *    }, 20);
   *  }
   * ];
   * async.parallel(tasks, function(err, res) {
   *   console.log(res); // [1, 2, 3, 4];
   *   console.log(order); // [1, 4, 2, 3]
   * });
   *
   * @example
   *
   * var order = [];
   * var tasks = {
   *   'a': function(done) {
   *     setTimeout(function() {
   *       order.push(1);
   *       done(null, 1);
   *     }, 10);
   *   },
   *   'b': function(done) {
   *     setTimeout(function() {
   *       order.push(2);
   *       done(null, 2);
   *     }, 30);
   *   },
   *   'c': function(done) {
   *     setTimeout(function() {
   *       order.push(3);
   *       done(null, 3);
   *     }, 40);
   *   },
   *   'd': function(done) {
   *     setTimeout(function() {
   *       order.push(4);
   *       done(null, 4);
   *     }, 20);
   *   }
   * };
   * async.parallel(tasks, function(err, res) {
   *   console.log(res); // { a: 1, b: 2, c: 3, d:4 }
   *   console.log(order); // [1, 4, 2, 3]
   * });
   *
   */
  var parallel = createParallel(arrayEachFunc, baseEachFunc);

  /**
   * @memberof async
   * @namespace applyEach
   */
  var applyEach = createApplyEach(map);

  /**
   * @memberof async
   * @namespace applyEachSeries
   */
  var applyEachSeries = createApplyEach(mapSeries);

  /**
   * @memberof async
   * @namespace log
   */
  var log = createLogger('log');

  /**
   * @memberof async
   * @namespace dir
   */
  var dir = createLogger('dir');

  /**
   * @version 2.6.2
   * @namespace async
   */
  var index = {
    VERSION: '2.6.2',

    // Collections
    each: each,
    eachSeries: eachSeries,
    eachLimit: eachLimit,
    forEach: each,
    forEachSeries: eachSeries,
    forEachLimit: eachLimit,
    eachOf: each,
    eachOfSeries: eachSeries,
    eachOfLimit: eachLimit,
    forEachOf: each,
    forEachOfSeries: eachSeries,
    forEachOfLimit: eachLimit,
    map: map,
    mapSeries: mapSeries,
    mapLimit: mapLimit,
    mapValues: mapValues,
    mapValuesSeries: mapValuesSeries,
    mapValuesLimit: mapValuesLimit,
    filter: filter,
    filterSeries: filterSeries,
    filterLimit: filterLimit,
    select: filter,
    selectSeries: filterSeries,
    selectLimit: filterLimit,
    reject: reject,
    rejectSeries: rejectSeries,
    rejectLimit: rejectLimit,
    detect: detect,
    detectSeries: detectSeries,
    detectLimit: detectLimit,
    find: detect,
    findSeries: detectSeries,
    findLimit: detectLimit,
    pick: pick,
    pickSeries: pickSeries,
    pickLimit: pickLimit,
    omit: omit,
    omitSeries: omitSeries,
    omitLimit: omitLimit,
    reduce: reduce,
    inject: reduce,
    foldl: reduce,
    reduceRight: reduceRight,
    foldr: reduceRight,
    transform: transform,
    transformSeries: transformSeries,
    transformLimit: transformLimit,
    sortBy: sortBy,
    sortBySeries: sortBySeries,
    sortByLimit: sortByLimit,
    some: some,
    someSeries: someSeries,
    someLimit: someLimit,
    any: some,
    anySeries: someSeries,
    anyLimit: someLimit,
    every: every,
    everySeries: everySeries,
    everyLimit: everyLimit,
    all: every,
    allSeries: everySeries,
    allLimit: everyLimit,
    concat: concat,
    concatSeries: concatSeries,
    concatLimit: concatLimit,
    groupBy: groupBy,
    groupBySeries: groupBySeries,
    groupByLimit: groupByLimit,

    // Control Flow
    parallel: parallel,
    series: series,
    parallelLimit: parallelLimit,
    tryEach: tryEach,
    waterfall: waterfall,
    angelFall: angelFall,
    angelfall: angelFall,
    whilst: whilst,
    doWhilst: doWhilst,
    until: until,
    doUntil: doUntil,
    during: during,
    doDuring: doDuring,
    forever: forever,
    compose: compose,
    seq: seq,
    applyEach: applyEach,
    applyEachSeries: applyEachSeries,
    queue: queue,
    priorityQueue: priorityQueue,
    cargo: cargo,
    auto: auto,
    autoInject: autoInject,
    retry: retry,
    retryable: retryable,
    iterator: iterator,
    times: times,
    timesSeries: timesSeries,
    timesLimit: timesLimit,
    race: race,

    // Utils
    apply: apply,
    nextTick: asyncNextTick,
    setImmediate: asyncSetImmediate,
    memoize: memoize,
    unmemoize: unmemoize,
    ensureAsync: ensureAsync,
    constant: constant,
    asyncify: asyncify,
    wrapSync: asyncify,
    log: log,
    dir: dir,
    reflect: reflect,
    reflectAll: reflectAll,
    timeout: timeout,
    createLogger: createLogger,

    // Mode
    safe: safe,
    fast: fast
  };

  exports['default'] = index;
  baseEachSync(
    index,
    function(func, key) {
      exports[key] = func;
    },
    nativeKeys(index)
  );

  /**
   * @private
   */
  function createImmediate(safeMode) {
    var delay = function delay(fn) {
      var args = slice(arguments, 1);
      setTimeout(function() {
        fn.apply(null, args);
      });
    };
    asyncSetImmediate = typeof setImmediate === func ? setImmediate : delay;
    if (typeof process === obj && typeof process.nextTick === func) {
      nextTick = /^v0.10/.test(process.version) ? asyncSetImmediate : process.nextTick;
      asyncNextTick = /^v0/.test(process.version) ? asyncSetImmediate : process.nextTick;
    } else {
      asyncNextTick = nextTick = asyncSetImmediate;
    }
    if (safeMode === false) {
      nextTick = function(cb) {
        cb();
      };
    }
  }

  /* sync functions based on lodash */

  /**
   * Converts `arguments` to an array.
   *
   * @private
   * @param {Array} array = The array to slice.
   */
  function createArray(array) {
    var index = -1;
    var size = array.length;
    var result = Array(size);

    while (++index < size) {
      result[index] = array[index];
    }
    return result;
  }

  /**
   * Create an array from `start`
   *
   * @private
   * @param {Array} array - The array to slice.
   * @param {number} start - The start position.
   */
  function slice(array, start) {
    var end = array.length;
    var index = -1;
    var size = end - start;
    if (size <= 0) {
      return [];
    }
    var result = Array(size);

    while (++index < size) {
      result[index] = array[index + start];
    }
    return result;
  }

  /**
   * @private
   * @param {Object} object
   */
  function objectClone(object) {
    var keys = nativeKeys(object);
    var size = keys.length;
    var index = -1;
    var result = {};

    while (++index < size) {
      var key = keys[index];
      result[key] = object[key];
    }
    return result;
  }

  /**
   * Create an array with all falsey values removed.
   *
   * @private
   * @param {Array} array - The array to compact.
   */
  function compact(array) {
    var index = -1;
    var size = array.length;
    var result = [];

    while (++index < size) {
      var value = array[index];
      if (value) {
        result[result.length] = value;
      }
    }
    return result;
  }

  /**
   * Create an array of reverse sequence.
   *
   * @private
   * @param {Array} array - The array to reverse.
   */
  function reverse(array) {
    var index = -1;
    var size = array.length;
    var result = Array(size);
    var resIndex = size;

    while (++index < size) {
      result[--resIndex] = array[index];
    }
    return result;
  }

  /**
   * Checks if key exists in object property.
   *
   * @private
   * @param {Object} object - The object to inspect.
   * @param {string} key - The key to check.
   */
  function has(object, key) {
    return object.hasOwnProperty(key);
  }

  /**
   * Check if target exists in array.
   * @private
   * @param {Array} array
   * @param {*} target
   */
  function notInclude(array, target) {
    var index = -1;
    var size = array.length;

    while (++index < size) {
      if (array[index] === target) {
        return false;
      }
    }
    return true;
  }

  /**
   * @private
   * @param {Array} array - The array to iterate over.
   * @param {Function} iterator - The function invoked per iteration.
   */
  function arrayEachSync(array, iterator) {
    var index = -1;
    var size = array.length;

    while (++index < size) {
      iterator(array[index], index);
    }
    return array;
  }

  /**
   * @private
   * @param {Object} object - The object to iterate over.
   * @param {Function} iterator - The function invoked per iteration.
   * @param {Array} keys
   */
  function baseEachSync(object, iterator, keys) {
    var index = -1;
    var size = keys.length;

    while (++index < size) {
      var key = keys[index];
      iterator(object[key], key);
    }
    return object;
  }

  /**
   * @private
   * @param {number} n
   * @param {Function} iterator
   */
  function timesSync(n, iterator) {
    var index = -1;
    while (++index < n) {
      iterator(index);
    }
  }

  /**
   * @private
   * @param {Array} array
   * @param {number[]} criteria
   */
  function sortByCriteria(array, criteria) {
    var l = array.length;
    var indices = Array(l);
    var i;
    for (i = 0; i < l; i++) {
      indices[i] = i;
    }
    quickSort(criteria, 0, l - 1, indices);
    var result = Array(l);
    for (var n = 0; n < l; n++) {
      i = indices[n];
      result[n] = i === undefined ? array[n] : array[i];
    }
    return result;
  }

  function partition(array, i, j, mid, indices) {
    var l = i;
    var r = j;
    while (l <= r) {
      i = l;
      while (l < r && array[l] < mid) {
        l++;
      }
      while (r >= i && array[r] >= mid) {
        r--;
      }
      if (l > r) {
        break;
      }
      swap(array, indices, l++, r--);
    }
    return l;
  }

  function swap(array, indices, l, r) {
    var n = array[l];
    array[l] = array[r];
    array[r] = n;
    var i = indices[l];
    indices[l] = indices[r];
    indices[r] = i;
  }

  function quickSort(array, i, j, indices) {
    if (i === j) {
      return;
    }
    var k = i;
    while (++k <= j && array[i] === array[k]) {
      var l = k - 1;
      if (indices[l] > indices[k]) {
        var index = indices[l];
        indices[l] = indices[k];
        indices[k] = index;
      }
    }
    if (k > j) {
      return;
    }
    var p = array[i] > array[k] ? i : k;
    k = partition(array, i, j, array[p], indices);
    quickSort(array, i, k - 1, indices);
    quickSort(array, k, j, indices);
  }

  /**
   * @Private
   */
  function makeConcatResult(array) {
    var result = [];
    arrayEachSync(array, function(value) {
      if (value === noop) {
        return;
      }
      if (isArray(value)) {
        nativePush.apply(result, value);
      } else {
        result.push(value);
      }
    });
    return result;
  }

  /* async functions */

  /**
   * @private
   */
  function arrayEach(array, iterator, callback) {
    var index = -1;
    var size = array.length;

    if (iterator.length === 3) {
      while (++index < size) {
        iterator(array[index], index, onlyOnce(callback));
      }
    } else {
      while (++index < size) {
        iterator(array[index], onlyOnce(callback));
      }
    }
  }

  /**
   * @private
   */
  function baseEach(object, iterator, callback, keys) {
    var key;
    var index = -1;
    var size = keys.length;

    if (iterator.length === 3) {
      while (++index < size) {
        key = keys[index];
        iterator(object[key], key, onlyOnce(callback));
      }
    } else {
      while (++index < size) {
        iterator(object[keys[index]], onlyOnce(callback));
      }
    }
  }

  /**
   * @private
   */
  function symbolEach(collection, iterator, callback) {
    var iter = collection[iteratorSymbol]();
    var index = 0;
    var item;
    if (iterator.length === 3) {
      while ((item = iter.next()).done === false) {
        iterator(item.value, index++, onlyOnce(callback));
      }
    } else {
      while ((item = iter.next()).done === false) {
        index++;
        iterator(item.value, onlyOnce(callback));
      }
    }
    return index;
  }

  /**
   * @private
   */
  function arrayEachResult(array, result, iterator, callback) {
    var index = -1;
    var size = array.length;

    if (iterator.length === 4) {
      while (++index < size) {
        iterator(result, array[index], index, onlyOnce(callback));
      }
    } else {
      while (++index < size) {
        iterator(result, array[index], onlyOnce(callback));
      }
    }
  }

  /**
   * @private
   */
  function baseEachResult(object, result, iterator, callback, keys) {
    var key;
    var index = -1;
    var size = keys.length;

    if (iterator.length === 4) {
      while (++index < size) {
        key = keys[index];
        iterator(result, object[key], key, onlyOnce(callback));
      }
    } else {
      while (++index < size) {
        iterator(result, object[keys[index]], onlyOnce(callback));
      }
    }
  }

  /**
   * @private
   */
  function symbolEachResult(collection, result, iterator, callback) {
    var item;
    var index = 0;
    var iter = collection[iteratorSymbol]();

    if (iterator.length === 4) {
      while ((item = iter.next()).done === false) {
        iterator(result, item.value, index++, onlyOnce(callback));
      }
    } else {
      while ((item = iter.next()).done === false) {
        index++;
        iterator(result, item.value, onlyOnce(callback));
      }
    }
    return index;
  }

  /**
   * @private
   */
  function arrayEachFunc(array, createCallback) {
    var index = -1;
    var size = array.length;

    while (++index < size) {
      array[index](createCallback(index));
    }
  }

  /**
   * @private
   */
  function baseEachFunc(object, createCallback, keys) {
    var key;
    var index = -1;
    var size = keys.length;

    while (++index < size) {
      key = keys[index];
      object[key](createCallback(key));
    }
  }

  /**
   * @private
   */
  function arrayEachIndex(array, iterator, createCallback) {
    var index = -1;
    var size = array.length;

    if (iterator.length === 3) {
      while (++index < size) {
        iterator(array[index], index, createCallback(index));
      }
    } else {
      while (++index < size) {
        iterator(array[index], createCallback(index));
      }
    }
  }

  /**
   * @private
   */
  function baseEachIndex(object, iterator, createCallback, keys) {
    var key;
    var index = -1;
    var size = keys.length;

    if (iterator.length === 3) {
      while (++index < size) {
        key = keys[index];
        iterator(object[key], key, createCallback(index));
      }
    } else {
      while (++index < size) {
        iterator(object[keys[index]], createCallback(index));
      }
    }
  }

  /**
   * @private
   */
  function symbolEachIndex(collection, iterator, createCallback) {
    var item;
    var index = 0;
    var iter = collection[iteratorSymbol]();

    if (iterator.length === 3) {
      while ((item = iter.next()).done === false) {
        iterator(item.value, index, createCallback(index++));
      }
    } else {
      while ((item = iter.next()).done === false) {
        iterator(item.value, createCallback(index++));
      }
    }
    return index;
  }

  /**
   * @private
   */
  function baseEachKey(object, iterator, createCallback, keys) {
    var key;
    var index = -1;
    var size = keys.length;

    if (iterator.length === 3) {
      while (++index < size) {
        key = keys[index];
        iterator(object[key], key, createCallback(key));
      }
    } else {
      while (++index < size) {
        key = keys[index];
        iterator(object[key], createCallback(key));
      }
    }
  }

  /**
   * @private
   */
  function symbolEachKey(collection, iterator, createCallback) {
    var item;
    var index = 0;
    var iter = collection[iteratorSymbol]();

    if (iterator.length === 3) {
      while ((item = iter.next()).done === false) {
        iterator(item.value, index, createCallback(index++));
      }
    } else {
      while ((item = iter.next()).done === false) {
        iterator(item.value, createCallback(index++));
      }
    }
    return index;
  }

  /**
   * @private
   */
  function arrayEachValue(array, iterator, createCallback) {
    var value;
    var index = -1;
    var size = array.length;

    if (iterator.length === 3) {
      while (++index < size) {
        value = array[index];
        iterator(value, index, createCallback(value));
      }
    } else {
      while (++index < size) {
        value = array[index];
        iterator(value, createCallback(value));
      }
    }
  }

  /**
   * @private
   */
  function baseEachValue(object, iterator, createCallback, keys) {
    var key, value;
    var index = -1;
    var size = keys.length;

    if (iterator.length === 3) {
      while (++index < size) {
        key = keys[index];
        value = object[key];
        iterator(value, key, createCallback(value));
      }
    } else {
      while (++index < size) {
        value = object[keys[index]];
        iterator(value, createCallback(value));
      }
    }
  }

  /**
   * @private
   */
  function symbolEachValue(collection, iterator, createCallback) {
    var value, item;
    var index = 0;
    var iter = collection[iteratorSymbol]();

    if (iterator.length === 3) {
      while ((item = iter.next()).done === false) {
        value = item.value;
        iterator(value, index++, createCallback(value));
      }
    } else {
      while ((item = iter.next()).done === false) {
        index++;
        value = item.value;
        iterator(value, createCallback(value));
      }
    }
    return index;
  }

  /**
   * @private
   */
  function arrayEachIndexValue(array, iterator, createCallback) {
    var value;
    var index = -1;
    var size = array.length;

    if (iterator.length === 3) {
      while (++index < size) {
        value = array[index];
        iterator(value, index, createCallback(index, value));
      }
    } else {
      while (++index < size) {
        value = array[index];
        iterator(value, createCallback(index, value));
      }
    }
  }

  /**
   * @private
   */
  function baseEachIndexValue(object, iterator, createCallback, keys) {
    var key, value;
    var index = -1;
    var size = keys.length;

    if (iterator.length === 3) {
      while (++index < size) {
        key = keys[index];
        value = object[key];
        iterator(value, key, createCallback(index, value));
      }
    } else {
      while (++index < size) {
        value = object[keys[index]];
        iterator(value, createCallback(index, value));
      }
    }
  }

  /**
   * @private
   */
  function symbolEachIndexValue(collection, iterator, createCallback) {
    var value, item;
    var index = 0;
    var iter = collection[iteratorSymbol]();

    if (iterator.length === 3) {
      while ((item = iter.next()).done === false) {
        value = item.value;
        iterator(value, index, createCallback(index++, value));
      }
    } else {
      while ((item = iter.next()).done === false) {
        value = item.value;
        iterator(value, createCallback(index++, value));
      }
    }
    return index;
  }

  /**
   * @private
   */
  function baseEachKeyValue(object, iterator, createCallback, keys) {
    var key, value;
    var index = -1;
    var size = keys.length;

    if (iterator.length === 3) {
      while (++index < size) {
        key = keys[index];
        value = object[key];
        iterator(value, key, createCallback(key, value));
      }
    } else {
      while (++index < size) {
        key = keys[index];
        value = object[key];
        iterator(value, createCallback(key, value));
      }
    }
  }

  /**
   * @private
   */
  function symbolEachKeyValue(collection, iterator, createCallback) {
    var value, item;
    var index = 0;
    var iter = collection[iteratorSymbol]();

    if (iterator.length === 3) {
      while ((item = iter.next()).done === false) {
        value = item.value;
        iterator(value, index, createCallback(index++, value));
      }
    } else {
      while ((item = iter.next()).done === false) {
        value = item.value;
        iterator(value, createCallback(index++, value));
      }
    }
    return index;
  }

  /**
   * @private
   * @param {Function} func
   */
  function onlyOnce(func) {
    return function(err, res) {
      var fn = func;
      func = throwError;
      fn(err, res);
    };
  }

  /**
   * @private
   * @param {Function} func
   */
  function once(func) {
    return function(err, res) {
      var fn = func;
      func = noop;
      fn(err, res);
    };
  }

  /**
   * @private
   * @param {Function} arrayEach
   * @param {Function} baseEach
   */
  function createEach(arrayEach, baseEach, symbolEach) {
    return function each(collection, iterator, callback) {
      callback = once(callback || noop);
      var size, keys;
      var completed = 0;
      if (isArray(collection)) {
        size = collection.length;
        arrayEach(collection, iterator, done);
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        size = symbolEach(collection, iterator, done);
        size && size === completed && callback(null);
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        baseEach(collection, iterator, done, keys);
      }
      if (!size) {
        callback(null);
      }

      function done(err, bool) {
        if (err) {
          callback = once(callback);
          callback(err);
        } else if (++completed === size) {
          callback(null);
        } else if (bool === false) {
          callback = once(callback);
          callback(null);
        }
      }
    };
  }

  /**
   * @private
   * @param {Function} arrayEach
   * @param {Function} baseEach
   * @param {Function} symbolEach
   */
  function createMap(arrayEach, baseEach, symbolEach, useArray) {
    var init, clone;
    if (useArray) {
      init = Array;
      clone = createArray;
    } else {
      init = function() {
        return {};
      };
      clone = objectClone;
    }

    return function(collection, iterator, callback) {
      callback = callback || noop;
      var size, keys, result;
      var completed = 0;

      if (isArray(collection)) {
        size = collection.length;
        result = init(size);
        arrayEach(collection, iterator, createCallback);
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        // TODO: size could be changed
        result = init(0);
        size = symbolEach(collection, iterator, createCallback);
        size && size === completed && callback(null, result);
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        result = init(size);
        baseEach(collection, iterator, createCallback, keys);
      }
      if (!size) {
        callback(null, init());
      }

      function createCallback(key) {
        return function done(err, res) {
          if (key === null) {
            throwError();
          }
          if (err) {
            key = null;
            callback = once(callback);
            callback(err, clone(result));
            return;
          }
          result[key] = res;
          key = null;
          if (++completed === size) {
            callback(null, result);
          }
        };
      }
    };
  }

  /**
   * @private
   * @param {Function} arrayEach
   * @param {Function} baseEach
   * @param {Function} symbolEach
   * @param {boolean} bool
   */
  function createFilter(arrayEach, baseEach, symbolEach, bool) {
    return function(collection, iterator, callback) {
      callback = callback || noop;
      var size, keys, result;
      var completed = 0;

      if (isArray(collection)) {
        size = collection.length;
        result = Array(size);
        arrayEach(collection, iterator, createCallback);
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        result = [];
        size = symbolEach(collection, iterator, createCallback);
        size && size === completed && callback(null, compact(result));
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        result = Array(size);
        baseEach(collection, iterator, createCallback, keys);
      }
      if (!size) {
        return callback(null, []);
      }

      function createCallback(index, value) {
        return function done(err, res) {
          if (index === null) {
            throwError();
          }
          if (err) {
            index = null;
            callback = once(callback);
            callback(err);
            return;
          }
          if (!!res === bool) {
            result[index] = value;
          }
          index = null;
          if (++completed === size) {
            callback(null, compact(result));
          }
        };
      }
    };
  }

  /**
   * @private
   * @param {boolean} bool
   */
  function createFilterSeries(bool) {
    return function(collection, iterator, callback) {
      callback = onlyOnce(callback || noop);
      var size, key, value, keys, iter, item, iterate;
      var sync = false;
      var completed = 0;
      var result = [];

      if (isArray(collection)) {
        size = collection.length;
        iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        size = Infinity;
        iter = collection[iteratorSymbol]();
        iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
      }
      if (!size) {
        return callback(null, []);
      }
      iterate();

      function arrayIterator() {
        value = collection[completed];
        iterator(value, done);
      }

      function arrayIteratorWithIndex() {
        value = collection[completed];
        iterator(value, completed, done);
      }

      function symbolIterator() {
        item = iter.next();
        value = item.value;
        item.done ? callback(null, result) : iterator(value, done);
      }

      function symbolIteratorWithKey() {
        item = iter.next();
        value = item.value;
        item.done ? callback(null, result) : iterator(value, completed, done);
      }

      function objectIterator() {
        key = keys[completed];
        value = collection[key];
        iterator(value, done);
      }

      function objectIteratorWithKey() {
        key = keys[completed];
        value = collection[key];
        iterator(value, key, done);
      }

      function done(err, res) {
        if (err) {
          callback(err);
          return;
        }
        if (!!res === bool) {
          result[result.length] = value;
        }
        if (++completed === size) {
          iterate = throwError;
          callback(null, result);
        } else if (sync) {
          nextTick(iterate);
        } else {
          sync = true;
          iterate();
        }
        sync = false;
      }
    };
  }

  /**
   * @private
   * @param {boolean} bool
   */
  function createFilterLimit(bool) {
    return function(collection, limit, iterator, callback) {
      callback = callback || noop;
      var size, index, key, value, keys, iter, item, iterate, result;
      var sync = false;
      var started = 0;
      var completed = 0;

      if (isArray(collection)) {
        size = collection.length;
        iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        size = Infinity;
        result = [];
        iter = collection[iteratorSymbol]();
        iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
      }
      if (!size || isNaN(limit) || limit < 1) {
        return callback(null, []);
      }
      result = result || Array(size);
      timesSync(limit > size ? size : limit, iterate);

      function arrayIterator() {
        index = started++;
        if (index < size) {
          value = collection[index];
          iterator(value, createCallback(value, index));
        }
      }

      function arrayIteratorWithIndex() {
        index = started++;
        if (index < size) {
          value = collection[index];
          iterator(value, index, createCallback(value, index));
        }
      }

      function symbolIterator() {
        item = iter.next();
        if (item.done === false) {
          value = item.value;
          iterator(value, createCallback(value, started++));
        } else if (completed === started && iterator !== noop) {
          iterator = noop;
          callback(null, compact(result));
        }
      }

      function symbolIteratorWithKey() {
        item = iter.next();
        if (item.done === false) {
          value = item.value;
          iterator(value, started, createCallback(value, started++));
        } else if (completed === started && iterator !== noop) {
          iterator = noop;
          callback(null, compact(result));
        }
      }

      function objectIterator() {
        index = started++;
        if (index < size) {
          value = collection[keys[index]];
          iterator(value, createCallback(value, index));
        }
      }

      function objectIteratorWithKey() {
        index = started++;
        if (index < size) {
          key = keys[index];
          value = collection[key];
          iterator(value, key, createCallback(value, index));
        }
      }

      function createCallback(value, index) {
        return function(err, res) {
          if (index === null) {
            throwError();
          }
          if (err) {
            index = null;
            iterate = noop;
            callback = once(callback);
            callback(err);
            return;
          }
          if (!!res === bool) {
            result[index] = value;
          }
          index = null;
          if (++completed === size) {
            callback = onlyOnce(callback);
            callback(null, compact(result));
          } else if (sync) {
            nextTick(iterate);
          } else {
            sync = true;
            iterate();
          }
          sync = false;
        };
      }
    };
  }

  /**
   * @memberof async
   * @namespace eachSeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done();
   *   }, num * 10);
   * };
   * async.eachSeries(array, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done();
   *   }, num * 10);
   * };
   * async.eachSeries(array, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [[1, 0], [3, 1], [2, 2]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done();
   *   }, num * 10);
   * };
   * async.eachSeries(object, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done();
   *   }, num * 10);
   * };
   * async.eachSeries(object, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [[1, 'a'], [3, 'b'], [2, 'b']]
   * });
   *
   * @example
   *
   * // break
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num !== 3);
   *   }, num * 10);
   * };
   * async.eachSeries(array, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [1, 3]
   * });
   */
  function eachSeries(collection, iterator, callback) {
    callback = onlyOnce(callback || noop);
    var size, key, keys, iter, item, iterate;
    var sync = false;
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    }
    if (!size) {
      return callback(null);
    }
    iterate();

    function arrayIterator() {
      iterator(collection[completed], done);
    }

    function arrayIteratorWithIndex() {
      iterator(collection[completed], completed, done);
    }

    function symbolIterator() {
      item = iter.next();
      item.done ? callback(null) : iterator(item.value, done);
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      item.done ? callback(null) : iterator(item.value, completed, done);
    }

    function objectIterator() {
      iterator(collection[keys[completed]], done);
    }

    function objectIteratorWithKey() {
      key = keys[completed];
      iterator(collection[key], key, done);
    }

    function done(err, bool) {
      if (err) {
        callback(err);
      } else if (++completed === size || bool === false) {
        iterate = throwError;
        callback(null);
      } else if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace eachLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done();
   *   }, num * 10);
   * };
   * async.eachLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done();
   *   }, num * 10);
   * };
   * async.eachLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [[1, 0], [3, 2], [5, 1], [2, 4], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done();
   *   }, num * 10);
   * };
   * async.eachLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done();
   *   }, num * 10);
   * };
   * async.eachLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [[1, 'a'], [3, 'c'], [5, 'b'], [2, 'e'], [4, 'd']]
   * });
   *
   * @example
   *
   * // break
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num !== 5);
   *   }, num * 10);
   * };
   * async.eachLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [1, 3, 5]
   * });
   *
   */
  function eachLimit(collection, limit, iterator, callback) {
    callback = callback || noop;
    var size, index, key, keys, iter, item, iterate;
    var sync = false;
    var started = 0;
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    } else {
      return callback(null);
    }
    if (!size || isNaN(limit) || limit < 1) {
      return callback(null);
    }
    timesSync(limit > size ? size : limit, iterate);

    function arrayIterator() {
      if (started < size) {
        iterator(collection[started++], done);
      }
    }

    function arrayIteratorWithIndex() {
      index = started++;
      if (index < size) {
        iterator(collection[index], index, done);
      }
    }

    function symbolIterator() {
      item = iter.next();
      if (item.done === false) {
        started++;
        iterator(item.value, done);
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null);
      }
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      if (item.done === false) {
        iterator(item.value, started++, done);
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null);
      }
    }

    function objectIterator() {
      if (started < size) {
        iterator(collection[keys[started++]], done);
      }
    }

    function objectIteratorWithKey() {
      index = started++;
      if (index < size) {
        key = keys[index];
        iterator(collection[key], key, done);
      }
    }

    function done(err, bool) {
      if (err || bool === false) {
        iterate = noop;
        callback = once(callback);
        callback(err);
      } else if (++completed === size) {
        iterator = noop;
        iterate = throwError;
        callback = onlyOnce(callback);
        callback(null);
      } else if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace mapSeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapSeries(array, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2];
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapSeries(array, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2]
   *   console.log(order); // [[1, 0], [3, 1], [2, 2]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapSeries(object, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2]
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapSeries(object, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2]
   *   console.log(order); // [[1, 'a'], [3, 'b'], [2, 'c']]
   * });
   *
   */
  function mapSeries(collection, iterator, callback) {
    callback = callback || noop;
    var size, key, keys, iter, item, result, iterate;
    var sync = false;
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      result = [];
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    }
    if (!size) {
      return callback(null, []);
    }
    result = result || Array(size);
    iterate();

    function arrayIterator() {
      iterator(collection[completed], done);
    }

    function arrayIteratorWithIndex() {
      iterator(collection[completed], completed, done);
    }

    function symbolIterator() {
      item = iter.next();
      item.done ? callback(null, result) : iterator(item.value, done);
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      item.done ? callback(null, result) : iterator(item.value, completed, done);
    }

    function objectIterator() {
      iterator(collection[keys[completed]], done);
    }

    function objectIteratorWithKey() {
      key = keys[completed];
      iterator(collection[key], key, done);
    }

    function done(err, res) {
      if (err) {
        iterate = throwError;
        callback = onlyOnce(callback);
        callback(err, createArray(result));
        return;
      }
      result[completed] = res;
      if (++completed === size) {
        iterate = throwError;
        callback(null, result);
        callback = throwError;
      } else if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace mapLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 5, 3, 4, 2]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 5, 3, 4, 2]
   *   console.log(order); // [[1, 0], [3, 2], [5, 1], [2, 4], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 5, 3, 4, 2]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 5, 3, 4, 2]
   *   console.log(order); // [[1, 'a'], [3, 'c'], [5, 'b'], [2, 'e'], [4, 'd']]
   * });
   *
   */
  function mapLimit(collection, limit, iterator, callback) {
    callback = callback || noop;
    var size, index, key, keys, iter, item, result, iterate;
    var sync = false;
    var started = 0;
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      result = [];
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    }
    if (!size || isNaN(limit) || limit < 1) {
      return callback(null, []);
    }
    result = result || Array(size);
    timesSync(limit > size ? size : limit, iterate);

    function arrayIterator() {
      index = started++;
      if (index < size) {
        iterator(collection[index], createCallback(index));
      }
    }

    function arrayIteratorWithIndex() {
      index = started++;
      if (index < size) {
        iterator(collection[index], index, createCallback(index));
      }
    }

    function symbolIterator() {
      item = iter.next();
      if (item.done === false) {
        iterator(item.value, createCallback(started++));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, result);
      }
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      if (item.done === false) {
        iterator(item.value, started, createCallback(started++));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, result);
      }
    }

    function objectIterator() {
      index = started++;
      if (index < size) {
        iterator(collection[keys[index]], createCallback(index));
      }
    }

    function objectIteratorWithKey() {
      index = started++;
      if (index < size) {
        key = keys[index];
        iterator(collection[key], key, createCallback(index));
      }
    }

    function createCallback(index) {
      return function(err, res) {
        if (index === null) {
          throwError();
        }
        if (err) {
          index = null;
          iterate = noop;
          callback = once(callback);
          callback(err, createArray(result));
          return;
        }
        result[index] = res;
        index = null;
        if (++completed === size) {
          iterate = throwError;
          callback(null, result);
          callback = throwError;
        } else if (sync) {
          nextTick(iterate);
        } else {
          sync = true;
          iterate();
        }
        sync = false;
      };
    }
  }

  /**
   * @memberof async
   * @namespace mapValuesSeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValuesSeries(array, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 3, '2': 2 }
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValuesSeries(array, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 3, '2': 2 }
   *   console.log(order); // [[1, 0], [3, 1], [2, 2]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValuesSeries(object, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 3, c: 2 }
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValuesSeries(object, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 3, c: 2 }
   *   console.log(order); // [[1, 'a'], [3, 'b'], [2, 'c']]
   * });
   *
   */
  function mapValuesSeries(collection, iterator, callback) {
    callback = callback || noop;
    var size, key, keys, iter, item, iterate;
    var sync = false;
    var result = {};
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    }
    if (!size) {
      return callback(null, result);
    }
    iterate();

    function arrayIterator() {
      key = completed;
      iterator(collection[completed], done);
    }

    function arrayIteratorWithIndex() {
      key = completed;
      iterator(collection[completed], completed, done);
    }

    function symbolIterator() {
      key = completed;
      item = iter.next();
      item.done ? callback(null, result) : iterator(item.value, done);
    }

    function symbolIteratorWithKey() {
      key = completed;
      item = iter.next();
      item.done ? callback(null, result) : iterator(item.value, completed, done);
    }

    function objectIterator() {
      key = keys[completed];
      iterator(collection[key], done);
    }

    function objectIteratorWithKey() {
      key = keys[completed];
      iterator(collection[key], key, done);
    }

    function done(err, res) {
      if (err) {
        iterate = throwError;
        callback = onlyOnce(callback);
        callback(err, objectClone(result));
        return;
      }
      result[key] = res;
      if (++completed === size) {
        iterate = throwError;
        callback(null, result);
        callback = throwError;
      } else if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace mapValuesLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValuesLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 5, '2': 3, '3': 4, '4': 2 }
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValuesLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 5, '2': 3, '3': 4, '4': 2 }
   *   console.log(order); // [[1, 0], [3, 2], [5, 1], [2, 4], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValuesLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 5, c: 3, d: 4, e: 2 }
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValuesLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 5, c: 3, d: 4, e: 2 }
   *   console.log(order); // [[1, 'a'], [3, 'c'], [5, 'b'], [2, 'e'], [4, 'd']]
   * });
   *
   */
  function mapValuesLimit(collection, limit, iterator, callback) {
    callback = callback || noop;
    var size, index, key, keys, iter, item, iterate;
    var sync = false;
    var result = {};
    var started = 0;
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    }
    if (!size || isNaN(limit) || limit < 1) {
      return callback(null, result);
    }
    timesSync(limit > size ? size : limit, iterate);

    function arrayIterator() {
      index = started++;
      if (index < size) {
        iterator(collection[index], createCallback(index));
      }
    }

    function arrayIteratorWithIndex() {
      index = started++;
      if (index < size) {
        iterator(collection[index], index, createCallback(index));
      }
    }

    function symbolIterator() {
      item = iter.next();
      if (item.done === false) {
        iterator(item.value, createCallback(started++));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, result);
      }
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      if (item.done === false) {
        iterator(item.value, started, createCallback(started++));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, result);
      }
    }

    function objectIterator() {
      index = started++;
      if (index < size) {
        key = keys[index];
        iterator(collection[key], createCallback(key));
      }
    }

    function objectIteratorWithKey() {
      index = started++;
      if (index < size) {
        key = keys[index];
        iterator(collection[key], key, createCallback(key));
      }
    }

    function createCallback(key) {
      return function(err, res) {
        if (key === null) {
          throwError();
        }
        if (err) {
          key = null;
          iterate = noop;
          callback = once(callback);
          callback(err, objectClone(result));
          return;
        }
        result[key] = res;
        key = null;
        if (++completed === size) {
          callback(null, result);
        } else if (sync) {
          nextTick(iterate);
        } else {
          sync = true;
          iterate();
        }
        sync = false;
      };
    }
  }

  /**
   * @private
   * @param {Function} arrayEach
   * @param {Function} baseEach
   * @param {Function} symbolEach
   * @param {boolean} bool
   */
  function createDetect(arrayEach, baseEach, symbolEach, bool) {
    return function(collection, iterator, callback) {
      callback = callback || noop;
      var size, keys;
      var completed = 0;

      if (isArray(collection)) {
        size = collection.length;
        arrayEach(collection, iterator, createCallback);
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        size = symbolEach(collection, iterator, createCallback);
        size && size === completed && callback(null);
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        baseEach(collection, iterator, createCallback, keys);
      }
      if (!size) {
        callback(null);
      }

      function createCallback(value) {
        var called = false;
        return function done(err, res) {
          if (called) {
            throwError();
          }
          called = true;
          if (err) {
            callback = once(callback);
            callback(err);
          } else if (!!res === bool) {
            callback = once(callback);
            callback(null, value);
          } else if (++completed === size) {
            callback(null);
          }
        };
      }
    };
  }

  /**
   * @private
   * @param {boolean} bool
   */
  function createDetectSeries(bool) {
    return function(collection, iterator, callback) {
      callback = onlyOnce(callback || noop);
      var size, key, value, keys, iter, item, iterate;
      var sync = false;
      var completed = 0;

      if (isArray(collection)) {
        size = collection.length;
        iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        size = Infinity;
        iter = collection[iteratorSymbol]();
        iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
      }
      if (!size) {
        return callback(null);
      }
      iterate();

      function arrayIterator() {
        value = collection[completed];
        iterator(value, done);
      }

      function arrayIteratorWithIndex() {
        value = collection[completed];
        iterator(value, completed, done);
      }

      function symbolIterator() {
        item = iter.next();
        value = item.value;
        item.done ? callback(null) : iterator(value, done);
      }

      function symbolIteratorWithKey() {
        item = iter.next();
        value = item.value;
        item.done ? callback(null) : iterator(value, completed, done);
      }

      function objectIterator() {
        value = collection[keys[completed]];
        iterator(value, done);
      }

      function objectIteratorWithKey() {
        key = keys[completed];
        value = collection[key];
        iterator(value, key, done);
      }

      function done(err, res) {
        if (err) {
          callback(err);
        } else if (!!res === bool) {
          iterate = throwError;
          callback(null, value);
        } else if (++completed === size) {
          iterate = throwError;
          callback(null);
        } else if (sync) {
          nextTick(iterate);
        } else {
          sync = true;
          iterate();
        }
        sync = false;
      }
    };
  }

  /**
   * @private
   * @param {boolean} bool
   */
  function createDetectLimit(bool) {
    return function(collection, limit, iterator, callback) {
      callback = callback || noop;
      var size, index, key, value, keys, iter, item, iterate;
      var sync = false;
      var started = 0;
      var completed = 0;

      if (isArray(collection)) {
        size = collection.length;
        iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        size = Infinity;
        iter = collection[iteratorSymbol]();
        iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
      }
      if (!size || isNaN(limit) || limit < 1) {
        return callback(null);
      }
      timesSync(limit > size ? size : limit, iterate);

      function arrayIterator() {
        index = started++;
        if (index < size) {
          value = collection[index];
          iterator(value, createCallback(value));
        }
      }

      function arrayIteratorWithIndex() {
        index = started++;
        if (index < size) {
          value = collection[index];
          iterator(value, index, createCallback(value));
        }
      }

      function symbolIterator() {
        item = iter.next();
        if (item.done === false) {
          started++;
          value = item.value;
          iterator(value, createCallback(value));
        } else if (completed === started && iterator !== noop) {
          iterator = noop;
          callback(null);
        }
      }

      function symbolIteratorWithKey() {
        item = iter.next();
        if (item.done === false) {
          value = item.value;
          iterator(value, started++, createCallback(value));
        } else if (completed === started && iterator !== noop) {
          iterator = noop;
          callback(null);
        }
      }

      function objectIterator() {
        index = started++;
        if (index < size) {
          value = collection[keys[index]];
          iterator(value, createCallback(value));
        }
      }

      function objectIteratorWithKey() {
        if (started < size) {
          key = keys[started++];
          value = collection[key];
          iterator(value, key, createCallback(value));
        }
      }

      function createCallback(value) {
        var called = false;
        return function(err, res) {
          if (called) {
            throwError();
          }
          called = true;
          if (err) {
            iterate = noop;
            callback = once(callback);
            callback(err);
          } else if (!!res === bool) {
            iterate = noop;
            callback = once(callback);
            callback(null, value);
          } else if (++completed === size) {
            callback(null);
          } else if (sync) {
            nextTick(iterate);
          } else {
            sync = true;
            iterate();
          }
          sync = false;
        };
      }
    };
  }

  /**
   * @private
   * @param {Function} arrayEach
   * @param {Function} baseEach
   * @param {Function} symbolEach
   * @param {boolean} bool
   */
  function createPick(arrayEach, baseEach, symbolEach, bool) {
    return function(collection, iterator, callback) {
      callback = callback || noop;
      var size, keys;
      var completed = 0;
      var result = {};

      if (isArray(collection)) {
        size = collection.length;
        arrayEach(collection, iterator, createCallback);
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        size = symbolEach(collection, iterator, createCallback);
        size && size === completed && callback(null, result);
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        baseEach(collection, iterator, createCallback, keys);
      }
      if (!size) {
        return callback(null, {});
      }

      function createCallback(key, value) {
        return function done(err, res) {
          if (key === null) {
            throwError();
          }
          if (err) {
            key = null;
            callback = once(callback);
            callback(err, objectClone(result));
            return;
          }
          if (!!res === bool) {
            result[key] = value;
          }
          key = null;
          if (++completed === size) {
            callback(null, result);
          }
        };
      }
    };
  }

  /**
   * @private
   * @param {boolean} bool
   */
  function createPickSeries(bool) {
    return function(collection, iterator, callback) {
      callback = onlyOnce(callback || noop);
      var size, key, value, keys, iter, item, iterate;
      var sync = false;
      var result = {};
      var completed = 0;

      if (isArray(collection)) {
        size = collection.length;
        iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        size = Infinity;
        iter = collection[iteratorSymbol]();
        iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
      }
      if (!size) {
        return callback(null, {});
      }
      iterate();

      function arrayIterator() {
        key = completed;
        value = collection[completed];
        iterator(value, done);
      }

      function arrayIteratorWithIndex() {
        key = completed;
        value = collection[completed];
        iterator(value, completed, done);
      }

      function symbolIterator() {
        key = completed;
        item = iter.next();
        value = item.value;
        item.done ? callback(null, result) : iterator(value, done);
      }

      function symbolIteratorWithKey() {
        key = completed;
        item = iter.next();
        value = item.value;
        item.done ? callback(null, result) : iterator(value, key, done);
      }

      function objectIterator() {
        key = keys[completed];
        value = collection[key];
        iterator(value, done);
      }

      function objectIteratorWithKey() {
        key = keys[completed];
        value = collection[key];
        iterator(value, key, done);
      }

      function done(err, res) {
        if (err) {
          callback(err, result);
          return;
        }
        if (!!res === bool) {
          result[key] = value;
        }
        if (++completed === size) {
          iterate = throwError;
          callback(null, result);
        } else if (sync) {
          nextTick(iterate);
        } else {
          sync = true;
          iterate();
        }
        sync = false;
      }
    };
  }

  /**
   * @private
   * @param {boolean} bool
   */
  function createPickLimit(bool) {
    return function(collection, limit, iterator, callback) {
      callback = callback || noop;
      var size, index, key, value, keys, iter, item, iterate;
      var sync = false;
      var result = {};
      var started = 0;
      var completed = 0;

      if (isArray(collection)) {
        size = collection.length;
        iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        size = Infinity;
        iter = collection[iteratorSymbol]();
        iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
      }
      if (!size || isNaN(limit) || limit < 1) {
        return callback(null, {});
      }
      timesSync(limit > size ? size : limit, iterate);

      function arrayIterator() {
        index = started++;
        if (index < size) {
          value = collection[index];
          iterator(value, createCallback(value, index));
        }
      }

      function arrayIteratorWithIndex() {
        index = started++;
        if (index < size) {
          value = collection[index];
          iterator(value, index, createCallback(value, index));
        }
      }

      function symbolIterator() {
        item = iter.next();
        if (item.done === false) {
          value = item.value;
          iterator(value, createCallback(value, started++));
        } else if (completed === started && iterator !== noop) {
          iterator = noop;
          callback(null, result);
        }
      }

      function symbolIteratorWithKey() {
        item = iter.next();
        if (item.done === false) {
          value = item.value;
          iterator(value, started, createCallback(value, started++));
        } else if (completed === started && iterator !== noop) {
          iterator = noop;
          callback(null, result);
        }
      }

      function objectIterator() {
        if (started < size) {
          key = keys[started++];
          value = collection[key];
          iterator(value, createCallback(value, key));
        }
      }

      function objectIteratorWithKey() {
        if (started < size) {
          key = keys[started++];
          value = collection[key];
          iterator(value, key, createCallback(value, key));
        }
      }

      function createCallback(value, key) {
        return function(err, res) {
          if (key === null) {
            throwError();
          }
          if (err) {
            key = null;
            iterate = noop;
            callback = once(callback);
            callback(err, objectClone(result));
            return;
          }
          if (!!res === bool) {
            result[key] = value;
          }
          key = null;
          if (++completed === size) {
            iterate = throwError;
            callback = onlyOnce(callback);
            callback(null, result);
          } else if (sync) {
            nextTick(iterate);
          } else {
            sync = true;
            iterate();
          }
          sync = false;
        };
      }
    };
  }

  /**
   * @memberof async
   * @namespace reduce
   * @param {Array|Object} collection
   * @param {*} result
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var collection = [1, 3, 2, 4];
   * var iterator = function(result, num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, result + num);
   *   }, num * 10);
   * };
   * async.reduce(collection, 0, iterator, function(err, res) {
   *   console.log(res); // 10
   *   console.log(order); // [1, 3, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var collection = [1, 3, 2, 4];
   * var iterator = function(result, num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, result + num);
   *   }, num * 10);
   * };
   * async.reduce(collection, '', iterator, function(err, res) {
   *   console.log(res); // '1324'
   *   console.log(order); // [[1, 0], [3, 1], [2, 2], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(result, num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, result + num);
   *   }, num * 10);
   * };
   * async.reduce(collection, '', iterator, function(err, res) {
   *   console.log(res); // '1324'
   *   console.log(order); // [1, 3, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(result, num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, result + num);
   *   }, num * 10);
   * };
   * async.reduce(collection, 0, iterator, function(err, res) {
   *   console.log(res); // 10
   *   console.log(order); // [[1, 'a'], [3, 'b'], [2, 'b'], [4, 'd']]
   * });
   *
   */
  function reduce(collection, result, iterator, callback) {
    callback = onlyOnce(callback || noop);
    var size, key, keys, iter, item, iterate;
    var sync = false;
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      iterate = iterator.length === 4 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 4 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      iterate = iterator.length === 4 ? objectIteratorWithKey : objectIterator;
    }
    if (!size) {
      return callback(null, result);
    }
    iterate(result);

    function arrayIterator(result) {
      iterator(result, collection[completed], done);
    }

    function arrayIteratorWithIndex(result) {
      iterator(result, collection[completed], completed, done);
    }

    function symbolIterator(result) {
      item = iter.next();
      item.done ? callback(null, result) : iterator(result, item.value, done);
    }

    function symbolIteratorWithKey(result) {
      item = iter.next();
      item.done ? callback(null, result) : iterator(result, item.value, completed, done);
    }

    function objectIterator(result) {
      iterator(result, collection[keys[completed]], done);
    }

    function objectIteratorWithKey(result) {
      key = keys[completed];
      iterator(result, collection[key], key, done);
    }

    function done(err, result) {
      if (err) {
        callback(err, result);
      } else if (++completed === size) {
        iterator = throwError;
        callback(null, result);
      } else if (sync) {
        nextTick(function() {
          iterate(result);
        });
      } else {
        sync = true;
        iterate(result);
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace reduceRight
   * @param {Array|Object} collection
   * @param {*} result
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var collection = [1, 3, 2, 4];
   * var iterator = function(result, num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, result + num);
   *   }, num * 10);
   * };
   * async.reduceRight(collection, 0, iterator, function(err, res) {
   *   console.log(res); // 10
   *   console.log(order); // [4, 2, 3, 1]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var collection = [1, 3, 2, 4];
   * var iterator = function(result, num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, result + num);
   *   }, num * 10);
   * };
   * async.reduceRight(collection, '', iterator, function(err, res) {
   *   console.log(res); // '4231'
   *   console.log(order); // [[4, 3], [2, 2], [3, 1], [1, 0]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(result, num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, result + num);
   *   }, num * 10);
   * };
   * async.reduceRight(collection, '', iterator, function(err, res) {
   *   console.log(res); // '4231'
   *   console.log(order); // [4, 2, 3, 1]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(result, num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, result + num);
   *   }, num * 10);
   * };
   * async.reduceRight(collection, 0, iterator, function(err, res) {
   *   console.log(res); // 10
   *   console.log(order); // [[4, 3], [2, 2], [3, 1], [1, 0]]
   * });
   *
   */
  function reduceRight(collection, result, iterator, callback) {
    callback = onlyOnce(callback || noop);
    var resIndex, index, key, keys, iter, item, col, iterate;
    var sync = false;

    if (isArray(collection)) {
      resIndex = collection.length;
      iterate = iterator.length === 4 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      col = [];
      iter = collection[iteratorSymbol]();
      index = -1;
      while ((item = iter.next()).done === false) {
        col[++index] = item.value;
      }
      collection = col;
      resIndex = col.length;
      iterate = iterator.length === 4 ? arrayIteratorWithIndex : arrayIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      resIndex = keys.length;
      iterate = iterator.length === 4 ? objectIteratorWithKey : objectIterator;
    }
    if (!resIndex) {
      return callback(null, result);
    }
    iterate(result);

    function arrayIterator(result) {
      iterator(result, collection[--resIndex], done);
    }

    function arrayIteratorWithIndex(result) {
      iterator(result, collection[--resIndex], resIndex, done);
    }

    function objectIterator(result) {
      iterator(result, collection[keys[--resIndex]], done);
    }

    function objectIteratorWithKey(result) {
      key = keys[--resIndex];
      iterator(result, collection[key], key, done);
    }

    function done(err, result) {
      if (err) {
        callback(err, result);
      } else if (resIndex === 0) {
        iterate = throwError;
        callback(null, result);
      } else if (sync) {
        nextTick(function() {
          iterate(result);
        });
      } else {
        sync = true;
        iterate(result);
      }
      sync = false;
    }
  }

  /**
   * @private
   * @param {Function} arrayEach
   * @param {Function} baseEach
   * @param {Function} symbolEach
   */
  function createTransform(arrayEach, baseEach, symbolEach) {
    return function transform(collection, accumulator, iterator, callback) {
      if (arguments.length === 3) {
        callback = iterator;
        iterator = accumulator;
        accumulator = undefined;
      }
      callback = callback || noop;
      var size, keys, result;
      var completed = 0;

      if (isArray(collection)) {
        size = collection.length;
        result = accumulator !== undefined ? accumulator : [];
        arrayEach(collection, result, iterator, done);
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        result = accumulator !== undefined ? accumulator : {};
        size = symbolEach(collection, result, iterator, done);
        size && size === completed && callback(null, result);
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        result = accumulator !== undefined ? accumulator : {};
        baseEach(collection, result, iterator, done, keys);
      }
      if (!size) {
        callback(null, accumulator !== undefined ? accumulator : result || {});
      }

      function done(err, bool) {
        if (err) {
          callback = once(callback);
          callback(err, isArray(result) ? createArray(result) : objectClone(result));
        } else if (++completed === size) {
          callback(null, result);
        } else if (bool === false) {
          callback = once(callback);
          callback(null, isArray(result) ? createArray(result) : objectClone(result));
        }
      }
    };
  }

  /**
   * @memberof async
   * @namespace transformSeries
   * @param {Array|Object} collection
   * @param {Array|Object|Function} [accumulator]
   * @param {Function} [iterator]
   * @param {Function} [callback]
   * @example
   *
   * // array
   * var order = [];
   * var collection = [1, 3, 2, 4];
   * var iterator = function(result, num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     result.push(num)
   *     done();
   *   }, num * 10);
   * };
   * async.transformSeries(collection, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2, 4]
   *   console.log(order); // [1, 3, 2, 4]
   * });
   *
   * @example
   *
   * // array with index and accumulator
   * var order = [];
   * var collection = [1, 3, 2, 4];
   * var iterator = function(result, num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     result[index] = num;
   *     done();
   *   }, num * 10);
   * };
   * async.transformSeries(collection, {}, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 3, '2': 2, '3': 4 }
   *   console.log(order); // [[1, 0], [3, 1], [2, 2], [4, 3]]
   * });
   *
   * @example
   *
   * // object with accumulator
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(result, num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     result.push(num);
   *     done();
   *   }, num * 10);
   * };
   * async.transformSeries(collection, [], iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2, 4]
   *   console.log(order); // [1, 3, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(result, num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     result[key] = num;
   *     done();
   *   }, num * 10);
   * };
   * async.transformSeries(collection, iterator, function(err, res) {
   *   console.log(res); //  { a: 1, b: 3, c: 2, d: 4 }
   *   console.log(order); // [[1, 'a'], [3, 'b'], [2, 'b'], [4, 'd']]
   * });
   *
   */
  function transformSeries(collection, accumulator, iterator, callback) {
    if (arguments.length === 3) {
      callback = iterator;
      iterator = accumulator;
      accumulator = undefined;
    }
    callback = onlyOnce(callback || noop);
    var size, key, keys, iter, item, iterate, result;
    var sync = false;
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      result = accumulator !== undefined ? accumulator : [];
      iterate = iterator.length === 4 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      iter = collection[iteratorSymbol]();
      result = accumulator !== undefined ? accumulator : {};
      iterate = iterator.length === 4 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      result = accumulator !== undefined ? accumulator : {};
      iterate = iterator.length === 4 ? objectIteratorWithKey : objectIterator;
    }
    if (!size) {
      return callback(null, accumulator !== undefined ? accumulator : result || {});
    }
    iterate();

    function arrayIterator() {
      iterator(result, collection[completed], done);
    }

    function arrayIteratorWithIndex() {
      iterator(result, collection[completed], completed, done);
    }

    function symbolIterator() {
      item = iter.next();
      item.done ? callback(null, result) : iterator(result, item.value, done);
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      item.done ? callback(null, result) : iterator(result, item.value, completed, done);
    }

    function objectIterator() {
      iterator(result, collection[keys[completed]], done);
    }

    function objectIteratorWithKey() {
      key = keys[completed];
      iterator(result, collection[key], key, done);
    }

    function done(err, bool) {
      if (err) {
        callback(err, result);
      } else if (++completed === size || bool === false) {
        iterate = throwError;
        callback(null, result);
      } else if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace transformLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Array|Object|Function} [accumulator]
   * @param {Function} [iterator]
   * @param {Function} [callback]
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(result, num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     result.push(num);
   *     done();
   *   }, num * 10);
   * };
   * async.transformLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 5, 2, 4]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // array with index and accumulator
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(result, num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     result[index] = key;
   *     done();
   *   }, num * 10);
   * };
   * async.transformLimit(array, 2, {}, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 5, '2': 3, '3': 4, '4': 2 }
   *   console.log(order); // [[1, 0], [3, 2], [5, 1], [2, 4], [4, 3]]
   * });
   *
   * @example
   *
   * // object with accumulator
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(result, num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     result.push(num);
   *     done();
   *   }, num * 10);
   * };
   * async.transformLimit(object, 2, [], iterator, function(err, res) {
   *   console.log(res); // [1, 3, 5, 2, 4]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(result, num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     result[key] = num;
   *     done();
   *   }, num * 10);
   * };
   * async.transformLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 5, c: 3, d: 4, e: 2 };
   *   console.log(order); // [[1, 'a'], [3, 'c'], [5, 'b'], [2, 'e'], [4, 'd']]
   * });
   *
   */
  function transformLimit(collection, limit, accumulator, iterator, callback) {
    if (arguments.length === 4) {
      callback = iterator;
      iterator = accumulator;
      accumulator = undefined;
    }
    callback = callback || noop;
    var size, index, key, keys, iter, item, iterate, result;
    var sync = false;
    var started = 0;
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      result = accumulator !== undefined ? accumulator : [];
      iterate = iterator.length === 4 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      iter = collection[iteratorSymbol]();
      result = accumulator !== undefined ? accumulator : {};
      iterate = iterator.length === 4 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      result = accumulator !== undefined ? accumulator : {};
      iterate = iterator.length === 4 ? objectIteratorWithKey : objectIterator;
    }
    if (!size || isNaN(limit) || limit < 1) {
      return callback(null, accumulator !== undefined ? accumulator : result || {});
    }
    timesSync(limit > size ? size : limit, iterate);

    function arrayIterator() {
      index = started++;
      if (index < size) {
        iterator(result, collection[index], onlyOnce(done));
      }
    }

    function arrayIteratorWithIndex() {
      index = started++;
      if (index < size) {
        iterator(result, collection[index], index, onlyOnce(done));
      }
    }

    function symbolIterator() {
      item = iter.next();
      if (item.done === false) {
        started++;
        iterator(result, item.value, onlyOnce(done));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, result);
      }
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      if (item.done === false) {
        iterator(result, item.value, started++, onlyOnce(done));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, result);
      }
    }

    function objectIterator() {
      index = started++;
      if (index < size) {
        iterator(result, collection[keys[index]], onlyOnce(done));
      }
    }

    function objectIteratorWithKey() {
      index = started++;
      if (index < size) {
        key = keys[index];
        iterator(result, collection[key], key, onlyOnce(done));
      }
    }

    function done(err, bool) {
      if (err || bool === false) {
        iterate = noop;
        callback(err || null, isArray(result) ? createArray(result) : objectClone(result));
        callback = noop;
      } else if (++completed === size) {
        iterator = noop;
        callback(null, result);
      } else if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @private
   * @param {function} arrayEach
   * @param {function} baseEach
   * @param {function} symbolEach
   */
  function createSortBy(arrayEach, baseEach, symbolEach) {
    return function sortBy(collection, iterator, callback) {
      callback = callback || noop;
      var size, array, criteria;
      var completed = 0;

      if (isArray(collection)) {
        size = collection.length;
        array = Array(size);
        criteria = Array(size);
        arrayEach(collection, iterator, createCallback);
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        array = [];
        criteria = [];
        size = symbolEach(collection, iterator, createCallback);
        size && size === completed && callback(null, sortByCriteria(array, criteria));
      } else if (typeof collection === obj) {
        var keys = nativeKeys(collection);
        size = keys.length;
        array = Array(size);
        criteria = Array(size);
        baseEach(collection, iterator, createCallback, keys);
      }
      if (!size) {
        callback(null, []);
      }

      function createCallback(index, value) {
        var called = false;
        array[index] = value;
        return function done(err, criterion) {
          if (called) {
            throwError();
          }
          called = true;
          criteria[index] = criterion;
          if (err) {
            callback = once(callback);
            callback(err);
          } else if (++completed === size) {
            callback(null, sortByCriteria(array, criteria));
          }
        };
      }
    };
  }

  /**
   * @memberof async
   * @namespace sortBySeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortBySeries(array, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3];
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortBySeries(array, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3]
   *   console.log(order); // [[1, 0], [3, 1], [2, 2]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortBySeries(object, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3]
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortBySeries(object, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3]
   *   console.log(order); // [[1, 'a'], [3, 'b'], [2, 'c']]
   * });
   *
   */
  function sortBySeries(collection, iterator, callback) {
    callback = onlyOnce(callback || noop);
    var size, key, value, keys, iter, item, array, criteria, iterate;
    var sync = false;
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      array = collection;
      criteria = Array(size);
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      array = [];
      criteria = [];
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      array = Array(size);
      criteria = Array(size);
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    }
    if (!size) {
      return callback(null, []);
    }
    iterate();

    function arrayIterator() {
      value = collection[completed];
      iterator(value, done);
    }

    function arrayIteratorWithIndex() {
      value = collection[completed];
      iterator(value, completed, done);
    }

    function symbolIterator() {
      item = iter.next();
      if (item.done) {
        return callback(null, sortByCriteria(array, criteria));
      }
      value = item.value;
      array[completed] = value;
      iterator(value, done);
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      if (item.done) {
        return callback(null, sortByCriteria(array, criteria));
      }
      value = item.value;
      array[completed] = value;
      iterator(value, completed, done);
    }

    function objectIterator() {
      value = collection[keys[completed]];
      array[completed] = value;
      iterator(value, done);
    }

    function objectIteratorWithKey() {
      key = keys[completed];
      value = collection[key];
      array[completed] = value;
      iterator(value, key, done);
    }

    function done(err, criterion) {
      criteria[completed] = criterion;
      if (err) {
        callback(err);
      } else if (++completed === size) {
        iterate = throwError;
        callback(null, sortByCriteria(array, criteria));
      } else if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace sortByLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortByLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3, 4, 5]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortByLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3, 4, 5]
   *   console.log(order); // [[1, 0], [3, 2], [5, 1], [2, 4], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortByLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3, 4, 5]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortByLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3, 4, 5]
   *   console.log(order); // [[1, 'a'], [3, 'c'], [5, 'b'], [2, 'e'], [4, 'd']]
   * });
   *
   */
  function sortByLimit(collection, limit, iterator, callback) {
    callback = callback || noop;
    var size, index, key, value, array, keys, iter, item, criteria, iterate;
    var sync = false;
    var started = 0;
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      array = collection;
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      iter = collection[iteratorSymbol]();
      array = [];
      criteria = [];
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      array = Array(size);
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    }
    if (!size || isNaN(limit) || limit < 1) {
      return callback(null, []);
    }
    criteria = criteria || Array(size);
    timesSync(limit > size ? size : limit, iterate);

    function arrayIterator() {
      if (started < size) {
        value = collection[started];
        iterator(value, createCallback(value, started++));
      }
    }

    function arrayIteratorWithIndex() {
      index = started++;
      if (index < size) {
        value = collection[index];
        iterator(value, index, createCallback(value, index));
      }
    }

    function symbolIterator() {
      item = iter.next();
      if (item.done === false) {
        value = item.value;
        array[started] = value;
        iterator(value, createCallback(value, started++));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, sortByCriteria(array, criteria));
      }
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      if (item.done === false) {
        value = item.value;
        array[started] = value;
        iterator(value, started, createCallback(value, started++));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, sortByCriteria(array, criteria));
      }
    }

    function objectIterator() {
      if (started < size) {
        value = collection[keys[started]];
        array[started] = value;
        iterator(value, createCallback(value, started++));
      }
    }

    function objectIteratorWithKey() {
      if (started < size) {
        key = keys[started];
        value = collection[key];
        array[started] = value;
        iterator(value, key, createCallback(value, started++));
      }
    }

    function createCallback(value, index) {
      var called = false;
      return function(err, criterion) {
        if (called) {
          throwError();
        }
        called = true;
        criteria[index] = criterion;
        if (err) {
          iterate = noop;
          callback(err);
          callback = noop;
        } else if (++completed === size) {
          callback(null, sortByCriteria(array, criteria));
        } else if (sync) {
          nextTick(iterate);
        } else {
          sync = true;
          iterate();
        }
        sync = false;
      };
    }
  }

  /**
   * @memberof async
   * @namespace some
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.some(array, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.some(array, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [[1, 0]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.some(object, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.some(object, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [[1, 'a']]
   * });
   *
   */
  function some(collection, iterator, callback) {
    callback = callback || noop;
    detect(collection, iterator, done);

    function done(err, res) {
      if (err) {
        return callback(err);
      }
      callback(null, !!res);
    }
  }

  /**
   * @memberof async
   * @namespace someSeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.someSeries(array, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.someSeries(array, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [[1, 0]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.someSeries(object, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.someSeries(object, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [[1, 'a']]
   * });
   *
   */
  function someSeries(collection, iterator, callback) {
    callback = callback || noop;
    detectSeries(collection, iterator, done);

    function done(err, res) {
      if (err) {
        return callback(err);
      }
      callback(null, !!res);
    }
  }

  /**
   * @memberof async
   * @namespace someLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.someLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.someLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [[1, 0]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.someLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.someLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [[1, 'a']]
   * });
   *
   */
  function someLimit(collection, limit, iterator, callback) {
    callback = callback || noop;
    detectLimit(collection, limit, iterator, done);

    function done(err, res) {
      if (err) {
        return callback(err);
      }
      callback(null, !!res);
    }
  }

  /**
   * @private
   * @param {Function} arrayEach
   * @param {Function} baseEach
   * @param {Function} symbolEach
   */
  function createEvery(arrayEach, baseEach, symbolEach) {
    var deny = createDetect(arrayEach, baseEach, symbolEach, false);

    return function every(collection, iterator, callback) {
      callback = callback || noop;
      deny(collection, iterator, done);

      function done(err, res) {
        if (err) {
          return callback(err);
        }
        callback(null, !res);
      }
    };
  }

  /**
   * @private
   */
  function createEverySeries() {
    var denySeries = createDetectSeries(false);

    return function everySeries(collection, iterator, callback) {
      callback = callback || noop;
      denySeries(collection, iterator, done);

      function done(err, res) {
        if (err) {
          return callback(err);
        }
        callback(null, !res);
      }
    };
  }

  /**
   * @private
   */
  function createEveryLimit() {
    var denyLimit = createDetectLimit(false);

    return function everyLimit(collection, limit, iterator, callback) {
      callback = callback || noop;
      denyLimit(collection, limit, iterator, done);

      function done(err, res) {
        if (err) {
          return callback(err);
        }
        callback(null, !res);
      }
    };
  }

  /**
   * @private
   * @param {Function} arrayEach
   * @param {Function} baseEach
   * @param {Function} symbolEach
   */
  function createConcat(arrayEach, baseEach, symbolEach) {
    return function concat(collection, iterator, callback) {
      callback = callback || noop;
      var size, result;
      var completed = 0;

      if (isArray(collection)) {
        size = collection.length;
        result = Array(size);
        arrayEach(collection, iterator, createCallback);
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        result = [];
        size = symbolEach(collection, iterator, createCallback);
        size && size === completed && callback(null, result);
      } else if (typeof collection === obj) {
        var keys = nativeKeys(collection);
        size = keys.length;
        result = Array(size);
        baseEach(collection, iterator, createCallback, keys);
      }
      if (!size) {
        callback(null, []);
      }

      function createCallback(index) {
        return function done(err, res) {
          if (index === null) {
            throwError();
          }
          if (err) {
            index = null;
            callback = once(callback);
            arrayEachSync(result, function(array, index) {
              if (array === undefined) {
                result[index] = noop;
              }
            });
            callback(err, makeConcatResult(result));
            return;
          }
          switch (arguments.length) {
            case 0:
            case 1:
              result[index] = noop;
              break;
            case 2:
              result[index] = res;
              break;
            default:
              result[index] = slice(arguments, 1);
              break;
          }
          index = null;
          if (++completed === size) {
            callback(null, makeConcatResult(result));
          }
        };
      }
    };
  }

  /**
   * @memberof async
   * @namespace concatSeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, [num]);
   *   }, num * 10);
   * };
   * async.concatSeries(array, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2];
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, [num]);
   *   }, num * 10);
   * };
   * async.concatSeries(array, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2]
   *   console.log(order); // [[1, 0], [3, 1], [2, 2]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, [num]);
   *   }, num * 10);
   * };
   * async.concatSeries(object, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2]
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, [num]);
   *   }, num * 10);
   * };
   * async.concatSeries(object, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2]
   *   console.log(order); // [[1, 'a'], [3, 'b'], [2, 'c']]
   * });
   *
   */
  function concatSeries(collection, iterator, callback) {
    callback = onlyOnce(callback || noop);
    var size, key, keys, iter, item, iterate;
    var sync = false;
    var result = [];
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    }
    if (!size) {
      return callback(null, result);
    }
    iterate();

    function arrayIterator() {
      iterator(collection[completed], done);
    }

    function arrayIteratorWithIndex() {
      iterator(collection[completed], completed, done);
    }

    function symbolIterator() {
      item = iter.next();
      item.done ? callback(null, result) : iterator(item.value, done);
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      item.done ? callback(null, result) : iterator(item.value, completed, done);
    }

    function objectIterator() {
      iterator(collection[keys[completed]], done);
    }

    function objectIteratorWithKey() {
      key = keys[completed];
      iterator(collection[key], key, done);
    }

    function done(err, array) {
      if (isArray(array)) {
        nativePush.apply(result, array);
      } else if (arguments.length >= 2) {
        nativePush.apply(result, slice(arguments, 1));
      }
      if (err) {
        callback(err, result);
      } else if (++completed === size) {
        iterate = throwError;
        callback(null, result);
      } else if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace concatLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, [num]);
   *   }, num * 10);
   * };
   * async.concatLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 5, 2, 4]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, [num]);
   *   }, num * 10);
   * };
   * async.cocnatLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 5, 2, 4]
   *   console.log(order); // [[1, 0], [3, 2], [5, 1], [2, 4], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, [num]);
   *   }, num * 10);
   * };
   * async.concatLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 5, 2, 4]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.cocnatLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 5, 2, 4]
   *   console.log(order); // [[1, 'a'], [3, 'c'], [5, 'b'], [2, 'e'], [4, 'd']]
   * });
   *
   */
  function concatLimit(collection, limit, iterator, callback) {
    callback = callback || noop;
    var size, key, iter, item, iterate, result;
    var sync = false;
    var started = 0;
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      result = [];
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      var keys = nativeKeys(collection);
      size = keys.length;
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    }
    if (!size || isNaN(limit) || limit < 1) {
      return callback(null, []);
    }
    result = result || Array(size);
    timesSync(limit > size ? size : limit, iterate);

    function arrayIterator() {
      if (started < size) {
        iterator(collection[started], createCallback(started++));
      }
    }

    function arrayIteratorWithIndex() {
      if (started < size) {
        iterator(collection[started], started, createCallback(started++));
      }
    }

    function symbolIterator() {
      item = iter.next();
      if (item.done === false) {
        iterator(item.value, createCallback(started++));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, makeConcatResult(result));
      }
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      if (item.done === false) {
        iterator(item.value, started, createCallback(started++));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, makeConcatResult(result));
      }
    }

    function objectIterator() {
      if (started < size) {
        iterator(collection[keys[started]], createCallback(started++));
      }
    }

    function objectIteratorWithKey() {
      if (started < size) {
        key = keys[started];
        iterator(collection[key], key, createCallback(started++));
      }
    }

    function createCallback(index) {
      return function(err, res) {
        if (index === null) {
          throwError();
        }
        if (err) {
          index = null;
          iterate = noop;
          callback = once(callback);
          arrayEachSync(result, function(array, index) {
            if (array === undefined) {
              result[index] = noop;
            }
          });
          callback(err, makeConcatResult(result));
          return;
        }
        switch (arguments.length) {
          case 0:
          case 1:
            result[index] = noop;
            break;
          case 2:
            result[index] = res;
            break;
          default:
            result[index] = slice(arguments, 1);
            break;
        }
        index = null;
        if (++completed === size) {
          iterate = throwError;
          callback(null, makeConcatResult(result));
          callback = throwError;
        } else if (sync) {
          nextTick(iterate);
        } else {
          sync = true;
          iterate();
        }
        sync = false;
      };
    }
  }

  /**
   * @private
   * @param {Function} arrayEach
   * @param {Function} baseEach
   * @param {Function} symbolEach
   */
  function createGroupBy(arrayEach, baseEach, symbolEach) {
    return function groupBy(collection, iterator, callback) {
      callback = callback || noop;
      var size;
      var completed = 0;
      var result = {};

      if (isArray(collection)) {
        size = collection.length;
        arrayEach(collection, iterator, createCallback);
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        size = symbolEach(collection, iterator, createCallback);
        size && size === completed && callback(null, result);
      } else if (typeof collection === obj) {
        var keys = nativeKeys(collection);
        size = keys.length;
        baseEach(collection, iterator, createCallback, keys);
      }
      if (!size) {
        callback(null, {});
      }

      function createCallback(value) {
        var called = false;
        return function done(err, key) {
          if (called) {
            throwError();
          }
          called = true;
          if (err) {
            callback = once(callback);
            callback(err, objectClone(result));
            return;
          }
          var array = result[key];
          if (!array) {
            result[key] = [value];
          } else {
            array.push(value);
          }
          if (++completed === size) {
            callback(null, result);
          }
        };
      }
    };
  }

  /**
   * @memberof async
   * @namespace groupBySeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [4.2, 6.4, 6.1];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupBySeries(array, iterator, function(err, res) {
   *   console.log(res); // { '4': [4.2], '6': [6.4, 6.1] }
   *   console.log(order); // [4.2, 6.4, 6.1]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [4.2, 6.4, 6.1];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupBySeries(array, iterator, function(err, res) {
   *   console.log(res); // { '4': [4.2], '6': [6.4, 6.1] }
   *   console.log(order); // [[4.2, 0], [6.4, 1], [6.1, 2]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 4.2, b: 6.4, c: 6.1 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupBySeries(object, iterator, function(err, res) {
   *   console.log(res); // { '4': [4.2], '6': [6.4, 6.1] }
   *   console.log(order); // [4.2, 6.4, 6.1]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 4.2, b: 6.4, c: 6.1 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupBySeries(object, iterator, function(err, res) {
   *   console.log(res); // { '4': [4.2], '6': [6.4, 6.1] }
   *   console.log(order); // [[4.2, 'a'], [6.4, 'b'], [6.1, 'c']]
   * });
   *
   */
  function groupBySeries(collection, iterator, callback) {
    callback = onlyOnce(callback || noop);
    var size, key, value, keys, iter, item, iterate;
    var sync = false;
    var completed = 0;
    var result = {};

    if (isArray(collection)) {
      size = collection.length;
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    }
    if (!size) {
      return callback(null, result);
    }
    iterate();

    function arrayIterator() {
      value = collection[completed];
      iterator(value, done);
    }

    function arrayIteratorWithIndex() {
      value = collection[completed];
      iterator(value, completed, done);
    }

    function symbolIterator() {
      item = iter.next();
      value = item.value;
      item.done ? callback(null, result) : iterator(value, done);
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      value = item.value;
      item.done ? callback(null, result) : iterator(value, completed, done);
    }

    function objectIterator() {
      value = collection[keys[completed]];
      iterator(value, done);
    }

    function objectIteratorWithKey() {
      key = keys[completed];
      value = collection[key];
      iterator(value, key, done);
    }

    function done(err, key) {
      if (err) {
        iterate = throwError;
        callback = onlyOnce(callback);
        callback(err, objectClone(result));
        return;
      }
      var array = result[key];
      if (!array) {
        result[key] = [value];
      } else {
        array.push(value);
      }
      if (++completed === size) {
        iterate = throwError;
        callback(null, result);
      } else if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace groupByLimit
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1.1, 5.9, 3.2, 3.9, 2.1];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupByLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // { '1': [1.1], '3': [3.2, 3.9], '5': [5.9], '2': [2.1] }
   *   console.log(order); // [1.1, 3.2, 5.9, 2.1, 3.9]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1.1, 5.9, 3.2, 3.9, 2.1];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupByLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // { '1': [1.1], '3': [3.2, 3.9], '5': [5.9], '2': [2.1] }
   *   console.log(order); // [[1.1, 0], [3.2, 2], [5.9, 1], [2.1, 4], [3.9, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1.1, b: 5.9, c: 3.2, d: 3.9, e: 2.1 }
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupByLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // { '1': [1.1], '3': [3.2, 3.9], '5': [5.9], '2': [2.1] }
   *   console.log(order); // [1.1, 3.2, 5.9, 2.1, 3.9]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1.1, b: 5.9, c: 3.2, d: 3.9, e: 2.1 }
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupByLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // { '1': [1.1], '3': [3.2, 3.9], '5': [5.9], '2': [2.1] }
   *   console.log(order); // [[1.1, 'a'], [3.2, 'c'], [5.9, 'b'], [2.1, 'e'], [3.9, 'd']]
   * });
   *
   */
  function groupByLimit(collection, limit, iterator, callback) {
    callback = callback || noop;
    var size, index, key, value, keys, iter, item, iterate;
    var sync = false;
    var started = 0;
    var completed = 0;
    var result = {};

    if (isArray(collection)) {
      size = collection.length;
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    }
    if (!size || isNaN(limit) || limit < 1) {
      return callback(null, result);
    }
    timesSync(limit > size ? size : limit, iterate);

    function arrayIterator() {
      if (started < size) {
        value = collection[started++];
        iterator(value, createCallback(value));
      }
    }

    function arrayIteratorWithIndex() {
      index = started++;
      if (index < size) {
        value = collection[index];
        iterator(value, index, createCallback(value));
      }
    }

    function symbolIterator() {
      item = iter.next();
      if (item.done === false) {
        started++;
        value = item.value;
        iterator(value, createCallback(value));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, result);
      }
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      if (item.done === false) {
        value = item.value;
        iterator(value, started++, createCallback(value));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, result);
      }
    }

    function objectIterator() {
      if (started < size) {
        value = collection[keys[started++]];
        iterator(value, createCallback(value));
      }
    }

    function objectIteratorWithKey() {
      if (started < size) {
        key = keys[started++];
        value = collection[key];
        iterator(value, key, createCallback(value));
      }
    }

    function createCallback(value) {
      var called = false;
      return function(err, key) {
        if (called) {
          throwError();
        }
        called = true;
        if (err) {
          iterate = noop;
          callback = once(callback);
          callback(err, objectClone(result));
          return;
        }
        var array = result[key];
        if (!array) {
          result[key] = [value];
        } else {
          array.push(value);
        }
        if (++completed === size) {
          callback(null, result);
        } else if (sync) {
          nextTick(iterate);
        } else {
          sync = true;
          iterate();
        }
        sync = false;
      };
    }
  }

  /**
   * @private
   * @param {Function} arrayEach
   * @param {Function} baseEach
   */
  function createParallel(arrayEach, baseEach) {
    return function parallel(tasks, callback) {
      callback = callback || noop;
      var size, keys, result;
      var completed = 0;

      if (isArray(tasks)) {
        size = tasks.length;
        result = Array(size);
        arrayEach(tasks, createCallback);
      } else if (tasks && typeof tasks === obj) {
        keys = nativeKeys(tasks);
        size = keys.length;
        result = {};
        baseEach(tasks, createCallback, keys);
      }
      if (!size) {
        callback(null, result);
      }

      function createCallback(key) {
        return function(err, res) {
          if (key === null) {
            throwError();
          }
          if (err) {
            key = null;
            callback = once(callback);
            callback(err, result);
            return;
          }
          result[key] = arguments.length <= 2 ? res : slice(arguments, 1);
          key = null;
          if (++completed === size) {
            callback(null, result);
          }
        };
      }
    };
  }

  /**
   * @memberof async
   * @namespace series
   * @param {Array|Object} tasks - functions
   * @param {Function} callback
   * @example
   *
   * var order = [];
   * var tasks = [
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(1);
   *      done(null, 1);
   *    }, 10);
   *  },
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(2);
   *      done(null, 2);
   *    }, 30);
   *  },
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(3);
   *      done(null, 3);
   *    }, 40);
   *  },
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(4);
   *      done(null, 4);
   *    }, 20);
   *  }
   * ];
   * async.series(tasks, function(err, res) {
   *   console.log(res); // [1, 2, 3, 4];
   *   console.log(order); // [1, 2, 3, 4]
   * });
   *
   * @example
   *
   * var order = [];
   * var tasks = {
   *   'a': function(done) {
   *     setTimeout(function() {
   *       order.push(1);
   *       done(null, 1);
   *     }, 10);
   *   },
   *   'b': function(done) {
   *     setTimeout(function() {
   *       order.push(2);
   *       done(null, 2);
   *     }, 30);
   *   },
   *   'c': function(done) {
   *     setTimeout(function() {
   *       order.push(3);
   *       done(null, 3);
   *     }, 40);
   *   },
   *   'd': function(done) {
   *     setTimeout(function() {
   *       order.push(4);
   *       done(null, 4);
   *     }, 20);
   *   }
   * };
   * async.series(tasks, function(err, res) {
   *   console.log(res); // { a: 1, b: 2, c: 3, d:4 }
   *   console.log(order); // [1, 4, 2, 3]
   * });
   *
   */
  function series(tasks, callback) {
    callback = callback || noop;
    var size, key, keys, result, iterate;
    var sync = false;
    var completed = 0;

    if (isArray(tasks)) {
      size = tasks.length;
      result = Array(size);
      iterate = arrayIterator;
    } else if (tasks && typeof tasks === obj) {
      keys = nativeKeys(tasks);
      size = keys.length;
      result = {};
      iterate = objectIterator;
    } else {
      return callback(null);
    }
    if (!size) {
      return callback(null, result);
    }
    iterate();

    function arrayIterator() {
      key = completed;
      tasks[completed](done);
    }

    function objectIterator() {
      key = keys[completed];
      tasks[key](done);
    }

    function done(err, res) {
      if (err) {
        iterate = throwError;
        callback = onlyOnce(callback);
        callback(err, result);
        return;
      }
      result[key] = arguments.length <= 2 ? res : slice(arguments, 1);
      if (++completed === size) {
        iterate = throwError;
        callback(null, result);
      } else if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace parallelLimit
   * @param {Array|Object} tasks - functions
   * @param {number} limit - limit >= 1
   * @param {Function} callback
   * @example
   *
   * var order = [];
   * var tasks = [
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(1);
   *      done(null, 1);
   *    }, 10);
   *  },
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(2);
   *      done(null, 2);
   *    }, 50);
   *  },
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(3);
   *      done(null, 3);
   *    }, 30);
   *  },
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(4);
   *      done(null, 4);
   *    }, 40);
   *  }
   * ];
   * async.parallelLimit(tasks, 2, function(err, res) {
   *   console.log(res); // [1, 2, 3, 4];
   *   console.log(order); // [1, 3, 2, 4]
   * });
   *
   * @example
   *
   * var order = [];
   * var tasks = {
   *   'a': function(done) {
   *     setTimeout(function() {
   *       order.push(1);
   *       done(null, 1);
   *     }, 10);
   *   },
   *   'b': function(done) {
   *     setTimeout(function() {
   *       order.push(2);
   *       done(null, 2);
   *     }, 50);
   *   },
   *   'c': function(done) {
   *     setTimeout(function() {
   *       order.push(3);
   *       done(null, 3);
   *     }, 20);
   *   },
   *   'd': function(done) {
   *     setTimeout(function() {
   *       order.push(4);
   *       done(null, 4);
   *     }, 40);
   *   }
   * };
   * async.parallelLimit(tasks, 2, function(err, res) {
   *   console.log(res); // { a: 1, b: 2, c: 3, d:4 }
   *   console.log(order); // [1, 3, 2, 4]
   * });
   *
   */
  function parallelLimit(tasks, limit, callback) {
    callback = callback || noop;
    var size, index, key, keys, result, iterate;
    var sync = false;
    var started = 0;
    var completed = 0;

    if (isArray(tasks)) {
      size = tasks.length;
      result = Array(size);
      iterate = arrayIterator;
    } else if (tasks && typeof tasks === obj) {
      keys = nativeKeys(tasks);
      size = keys.length;
      result = {};
      iterate = objectIterator;
    }
    if (!size || isNaN(limit) || limit < 1) {
      return callback(null, result);
    }
    timesSync(limit > size ? size : limit, iterate);

    function arrayIterator() {
      index = started++;
      if (index < size) {
        tasks[index](createCallback(index));
      }
    }

    function objectIterator() {
      if (started < size) {
        key = keys[started++];
        tasks[key](createCallback(key));
      }
    }

    function createCallback(key) {
      return function(err, res) {
        if (key === null) {
          throwError();
        }
        if (err) {
          key = null;
          iterate = noop;
          callback = once(callback);
          callback(err, result);
          return;
        }
        result[key] = arguments.length <= 2 ? res : slice(arguments, 1);
        key = null;
        if (++completed === size) {
          callback(null, result);
        } else if (sync) {
          nextTick(iterate);
        } else {
          sync = true;
          iterate();
        }
        sync = false;
      };
    }
  }

  /**
   * @memberof async
   * @namespace tryEach
   * @param {Array|Object} tasks - functions
   * @param {Function} callback
   * @example
   *
   * var tasks = [
   *  function(done) {
   *    setTimeout(function() {
   *      done(new Error('error'));
   *    }, 10);
   *  },
   *  function(done) {
   *    setTimeout(function() {
   *      done(null, 2);
   *    }, 10);
   *  }
   * ];
   * async.tryEach(tasks, function(err, res) {
   *   console.log(res); // 2
   * });
   *
   * @example
   *
   * var tasks = [
   *  function(done) {
   *    setTimeout(function() {
   *      done(new Error('error1'));
   *    }, 10);
   *  },
   *  function(done) {
   *    setTimeout(function() {
   *      done(new Error('error2');
   *    }, 10);
   *  }
   * ];
   * async.tryEach(tasks, function(err, res) {
   *   console.log(err); // error2
   *   console.log(res); // undefined
   * });
   *
   */
  function tryEach(tasks, callback) {
    callback = callback || noop;
    var size, keys, iterate;
    var sync = false;
    var completed = 0;

    if (isArray(tasks)) {
      size = tasks.length;
      iterate = arrayIterator;
    } else if (tasks && typeof tasks === obj) {
      keys = nativeKeys(tasks);
      size = keys.length;
      iterate = objectIterator;
    }
    if (!size) {
      return callback(null);
    }
    iterate();

    function arrayIterator() {
      tasks[completed](done);
    }

    function objectIterator() {
      tasks[keys[completed]](done);
    }

    function done(err, res) {
      if (!err) {
        if (arguments.length <= 2) {
          callback(null, res);
        } else {
          callback(null, slice(arguments, 1));
        }
      } else if (++completed === size) {
        callback(err);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * check for waterfall tasks
   * @private
   * @param {Array} tasks
   * @param {Function} callback
   * @return {boolean}
   */
  function checkWaterfallTasks(tasks, callback) {
    if (!isArray(tasks)) {
      callback(new Error('First argument to waterfall must be an array of functions'));
      return false;
    }
    if (tasks.length === 0) {
      callback(null);
      return false;
    }
    return true;
  }

  /**
   * check for waterfall tasks
   * @private
   * @param {function} func
   * @param {Array|Object} args - arguments
   * @return {function} next
   */
  function waterfallIterator(func, args, next) {
    switch (args.length) {
      case 0:
      case 1:
        return func(next);
      case 2:
        return func(args[1], next);
      case 3:
        return func(args[1], args[2], next);
      case 4:
        return func(args[1], args[2], args[3], next);
      case 5:
        return func(args[1], args[2], args[3], args[4], next);
      case 6:
        return func(args[1], args[2], args[3], args[4], args[5], next);
      default:
        args = slice(args, 1);
        args.push(next);
        return func.apply(null, args);
    }
  }

  /**
   * @memberof async
   * @namespace waterfall
   * @param {Array} tasks - functions
   * @param {Function} callback
   * @example
   *
   * var order = [];
   * var tasks = [
   *   function(next) {
   *     setTimeout(function() {
   *       order.push(1);
   *       next(null, 1);
   *     }, 10);
   *   },
   *   function(arg1, next) {
   *     setTimeout(function() {
   *       order.push(2);
   *       next(null, 1, 2);
   *     }, 30);
   *   },
   *   function(arg1, arg2, next) {
   *     setTimeout(function() {
   *       order.push(3);
   *       next(null, 3);
   *     }, 20);
   *   },
   *   function(arg1, next) {
   *     setTimeout(function() {
   *       order.push(4);
   *       next(null, 1, 2, 3, 4);
   *     }, 40);
   *   }
   * ];
   * async.waterfall(tasks, function(err, arg1, arg2, arg3, arg4) {
   *   console.log(arg1, arg2, arg3, arg4); // 1 2 3 4
   * });
   *
   */
  function waterfall(tasks, callback) {
    callback = callback || noop;
    if (!checkWaterfallTasks(tasks, callback)) {
      return;
    }
    var func, args, done, sync;
    var completed = 0;
    var size = tasks.length;
    waterfallIterator(tasks[0], [], createCallback(0));

    function iterate() {
      waterfallIterator(func, args, createCallback(func));
    }

    function createCallback(index) {
      return function next(err, res) {
        if (index === undefined) {
          callback = noop;
          throwError();
        }
        index = undefined;
        if (err) {
          done = callback;
          callback = throwError;
          done(err);
          return;
        }
        if (++completed === size) {
          done = callback;
          callback = throwError;
          if (arguments.length <= 2) {
            done(err, res);
          } else {
            done.apply(null, createArray(arguments));
          }
          return;
        }
        if (sync) {
          args = arguments;
          func = tasks[completed] || throwError;
          nextTick(iterate);
        } else {
          sync = true;
          waterfallIterator(tasks[completed] || throwError, arguments, createCallback(completed));
        }
        sync = false;
      };
    }
  }

  /**
   * `angelFall` is like `waterfall` and inject callback to last argument of next task.
   *
   * @memberof async
   * @namespace angelFall
   * @param {Array} tasks - functions
   * @param {Function} callback
   * @example
   *
   * var order = [];
   * var tasks = [
   *   function(next) {
   *     setTimeout(function() {
   *       order.push(1);
   *       next(null, 1);
   *     }, 10);
   *   },
   *   function(arg1, empty, next) {
   *     setTimeout(function() {
   *       order.push(2);
   *       next(null, 1, 2);
   *     }, 30);
   *   },
   *   function(next) {
   *     setTimeout(function() {
   *       order.push(3);
   *       next(null, 3);
   *     }, 20);
   *   },
   *   function(arg1, empty1, empty2, empty3, next) {
   *     setTimeout(function() {
   *       order.push(4);
   *       next(null, 1, 2, 3, 4);
   *     }, 40);
   *   }
   * ];
   * async.angelFall(tasks, function(err, arg1, arg2, arg3, arg4) {
   *   console.log(arg1, arg2, arg3, arg4); // 1 2 3 4
   * });
   *
   */
  function angelFall(tasks, callback) {
    callback = callback || noop;
    if (!checkWaterfallTasks(tasks, callback)) {
      return;
    }
    var completed = 0;
    var sync = false;
    var size = tasks.length;
    var func = tasks[completed];
    var args = [];
    var iterate = function() {
      switch (func.length) {
        case 0:
          try {
            next(null, func());
          } catch (e) {
            next(e);
          }
          return;
        case 1:
          return func(next);
        case 2:
          return func(args[1], next);
        case 3:
          return func(args[1], args[2], next);
        case 4:
          return func(args[1], args[2], args[3], next);
        case 5:
          return func(args[1], args[2], args[3], args[4], next);
        default:
          args = slice(args, 1);
          args[func.length - 1] = next;
          return func.apply(null, args);
      }
    };
    iterate();

    function next(err, res) {
      if (err) {
        iterate = throwError;
        callback = onlyOnce(callback);
        callback(err);
        return;
      }
      if (++completed === size) {
        iterate = throwError;
        var done = callback;
        callback = throwError;
        if (arguments.length === 2) {
          done(err, res);
        } else {
          done.apply(null, createArray(arguments));
        }
        return;
      }
      func = tasks[completed];
      args = arguments;
      if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace whilst
   * @param {Function} test
   * @param {Function} iterator
   * @param {Function} callback
   */
  function whilst(test, iterator, callback) {
    callback = callback || noop;
    var sync = false;
    if (test()) {
      iterate();
    } else {
      callback(null);
    }

    function iterate() {
      if (sync) {
        nextTick(next);
      } else {
        sync = true;
        iterator(done);
      }
      sync = false;
    }

    function next() {
      iterator(done);
    }

    function done(err, arg) {
      if (err) {
        return callback(err);
      }
      if (arguments.length <= 2) {
        if (test(arg)) {
          iterate();
        } else {
          callback(null, arg);
        }
        return;
      }
      arg = slice(arguments, 1);
      if (test.apply(null, arg)) {
        iterate();
      } else {
        callback.apply(null, [null].concat(arg));
      }
    }
  }

  /**
   * @memberof async
   * @namespace doWhilst
   * @param {Function} iterator
   * @param {Function} test
   * @param {Function} callback
   */
  function doWhilst(iterator, test, callback) {
    callback = callback || noop;
    var sync = false;
    next();

    function iterate() {
      if (sync) {
        nextTick(next);
      } else {
        sync = true;
        iterator(done);
      }
      sync = false;
    }

    function next() {
      iterator(done);
    }

    function done(err, arg) {
      if (err) {
        return callback(err);
      }
      if (arguments.length <= 2) {
        if (test(arg)) {
          iterate();
        } else {
          callback(null, arg);
        }
        return;
      }
      arg = slice(arguments, 1);
      if (test.apply(null, arg)) {
        iterate();
      } else {
        callback.apply(null, [null].concat(arg));
      }
    }
  }

  /**
   * @memberof async
   * @namespace until
   * @param {Function} test
   * @param {Function} iterator
   * @param {Function} callback
   */
  function until(test, iterator, callback) {
    callback = callback || noop;
    var sync = false;
    if (!test()) {
      iterate();
    } else {
      callback(null);
    }

    function iterate() {
      if (sync) {
        nextTick(next);
      } else {
        sync = true;
        iterator(done);
      }
      sync = false;
    }

    function next() {
      iterator(done);
    }

    function done(err, arg) {
      if (err) {
        return callback(err);
      }
      if (arguments.length <= 2) {
        if (!test(arg)) {
          iterate();
        } else {
          callback(null, arg);
        }
        return;
      }
      arg = slice(arguments, 1);
      if (!test.apply(null, arg)) {
        iterate();
      } else {
        callback.apply(null, [null].concat(arg));
      }
    }
  }

  /**
   * @memberof async
   * @namespace doUntil
   * @param {Function} iterator
   * @param {Function} test
   * @param {Function} callback
   */
  function doUntil(iterator, test, callback) {
    callback = callback || noop;
    var sync = false;
    next();

    function iterate() {
      if (sync) {
        nextTick(next);
      } else {
        sync = true;
        iterator(done);
      }
      sync = false;
    }

    function next() {
      iterator(done);
    }

    function done(err, arg) {
      if (err) {
        return callback(err);
      }
      if (arguments.length <= 2) {
        if (!test(arg)) {
          iterate();
        } else {
          callback(null, arg);
        }
        return;
      }
      arg = slice(arguments, 1);
      if (!test.apply(null, arg)) {
        iterate();
      } else {
        callback.apply(null, [null].concat(arg));
      }
    }
  }

  /**
   * @memberof async
   * @namespace during
   * @param {Function} test
   * @param {Function} iterator
   * @param {Function} callback
   */
  function during(test, iterator, callback) {
    callback = callback || noop;
    _test();

    function _test() {
      test(iterate);
    }

    function iterate(err, truth) {
      if (err) {
        return callback(err);
      }
      if (truth) {
        iterator(done);
      } else {
        callback(null);
      }
    }

    function done(err) {
      if (err) {
        return callback(err);
      }
      _test();
    }
  }

  /**
   * @memberof async
   * @namespace doDuring
   * @param {Function} test
   * @param {Function} iterator
   * @param {Function} callback
   */
  function doDuring(iterator, test, callback) {
    callback = callback || noop;
    iterate(null, true);

    function iterate(err, truth) {
      if (err) {
        return callback(err);
      }
      if (truth) {
        iterator(done);
      } else {
        callback(null);
      }
    }

    function done(err, res) {
      if (err) {
        return callback(err);
      }
      switch (arguments.length) {
        case 0:
        case 1:
          test(iterate);
          break;
        case 2:
          test(res, iterate);
          break;
        default:
          var args = slice(arguments, 1);
          args.push(iterate);
          test.apply(null, args);
          break;
      }
    }
  }

  /**
   * @memberof async
   * @namespace forever
   */
  function forever(iterator, callback) {
    var sync = false;
    iterate();

    function iterate() {
      iterator(next);
    }

    function next(err) {
      if (err) {
        if (callback) {
          return callback(err);
        }
        throw err;
      }
      if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace compose
   */
  function compose() {
    return seq.apply(null, reverse(arguments));
  }

  /**
   * @memberof async
   * @namespace seq
   */
  function seq(/* functions... */) {
    var fns = createArray(arguments);

    return function() {
      var self = this;
      var args = createArray(arguments);
      var callback = args[args.length - 1];
      if (typeof callback === func) {
        args.pop();
      } else {
        callback = noop;
      }
      reduce(fns, args, iterator, done);

      function iterator(newargs, fn, callback) {
        var func = function(err) {
          var nextargs = slice(arguments, 1);
          callback(err, nextargs);
        };
        newargs.push(func);
        fn.apply(self, newargs);
      }

      function done(err, res) {
        res = isArray(res) ? res : [res];
        res.unshift(err);
        callback.apply(self, res);
      }
    };
  }

  function createApplyEach(func) {
    return function applyEach(fns /* arguments */) {
      var go = function() {
        var self = this;
        var args = createArray(arguments);
        var callback = args.pop() || noop;
        return func(fns, iterator, callback);

        function iterator(fn, done) {
          fn.apply(self, args.concat([done]));
        }
      };
      if (arguments.length > 1) {
        var args = slice(arguments, 1);
        return go.apply(this, args);
      } else {
        return go;
      }
    };
  }

  /**
   * @see https://github.com/caolan/async/blob/master/lib/internal/DoublyLinkedList.js
   */
  function DLL() {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  DLL.prototype._removeLink = function(node) {
    var prev = node.prev;
    var next = node.next;
    if (prev) {
      prev.next = next;
    } else {
      this.head = next;
    }
    if (next) {
      next.prev = prev;
    } else {
      this.tail = prev;
    }
    node.prev = null;
    node.next = null;
    this.length--;
    return node;
  };

  DLL.prototype.empty = DLL;

  DLL.prototype._setInitial = function(node) {
    this.length = 1;
    this.head = this.tail = node;
  };

  DLL.prototype.insertBefore = function(node, newNode) {
    newNode.prev = node.prev;
    newNode.next = node;
    if (node.prev) {
      node.prev.next = newNode;
    } else {
      this.head = newNode;
    }
    node.prev = newNode;
    this.length++;
  };

  DLL.prototype.unshift = function(node) {
    if (this.head) {
      this.insertBefore(this.head, node);
    } else {
      this._setInitial(node);
    }
  };

  DLL.prototype.push = function(node) {
    var tail = this.tail;
    if (tail) {
      node.prev = tail;
      node.next = tail.next;
      this.tail = node;
      tail.next = node;
      this.length++;
    } else {
      this._setInitial(node);
    }
  };

  DLL.prototype.shift = function() {
    return this.head && this._removeLink(this.head);
  };

  DLL.prototype.splice = function(end) {
    var task;
    var tasks = [];
    while (end-- && (task = this.shift())) {
      tasks.push(task);
    }
    return tasks;
  };

  DLL.prototype.remove = function(test) {
    var node = this.head;
    while (node) {
      if (test(node)) {
        this._removeLink(node);
      }
      node = node.next;
    }
    return this;
  };

  /**
   * @private
   */
  function baseQueue(isQueue, worker, concurrency, payload) {
    if (concurrency === undefined) {
      concurrency = 1;
    } else if (isNaN(concurrency) || concurrency < 1) {
      throw new Error('Concurrency must not be zero');
    }

    var workers = 0;
    var workersList = [];
    var _callback, _unshift;

    var q = {
      _tasks: new DLL(),
      concurrency: concurrency,
      payload: payload,
      saturated: noop,
      unsaturated: noop,
      buffer: concurrency / 4,
      empty: noop,
      drain: noop,
      error: noop,
      started: false,
      paused: false,
      push: push,
      kill: kill,
      unshift: unshift,
      remove: remove,
      process: isQueue ? runQueue : runCargo,
      length: getLength,
      running: running,
      workersList: getWorkersList,
      idle: idle,
      pause: pause,
      resume: resume,
      _worker: worker
    };
    return q;

    function push(tasks, callback) {
      _insert(tasks, callback);
    }

    function unshift(tasks, callback) {
      _insert(tasks, callback, true);
    }

    function _exec(task) {
      var item = {
        data: task,
        callback: _callback
      };
      if (_unshift) {
        q._tasks.unshift(item);
      } else {
        q._tasks.push(item);
      }
      nextTick(q.process);
    }

    function _insert(tasks, callback, unshift) {
      if (callback == null) {
        callback = noop;
      } else if (typeof callback !== 'function') {
        throw new Error('task callback must be a function');
      }
      q.started = true;
      var _tasks = isArray(tasks) ? tasks : [tasks];

      if (tasks === undefined || !_tasks.length) {
        if (q.idle()) {
          nextTick(q.drain);
        }
        return;
      }

      _unshift = unshift;
      _callback = callback;
      arrayEachSync(_tasks, _exec);
      // Avoid leaking the callback
      _callback = undefined;
    }

    function kill() {
      q.drain = noop;
      q._tasks.empty();
    }

    function _next(q, tasks) {
      var called = false;
      return function done(err, res) {
        if (called) {
          throwError();
        }
        called = true;

        workers--;
        var task;
        var index = -1;
        var size = workersList.length;
        var taskIndex = -1;
        var taskSize = tasks.length;
        var useApply = arguments.length > 2;
        var args = useApply && createArray(arguments);
        while (++taskIndex < taskSize) {
          task = tasks[taskIndex];
          while (++index < size) {
            if (workersList[index] === task) {
              if (index === 0) {
                workersList.shift();
              } else {
                workersList.splice(index, 1);
              }
              index = size;
              size--;
            }
          }
          index = -1;
          if (useApply) {
            task.callback.apply(task, args);
          } else {
            task.callback(err, res);
          }
          if (err) {
            q.error(err, task.data);
          }
        }

        if (workers <= q.concurrency - q.buffer) {
          q.unsaturated();
        }

        if (q._tasks.length + workers === 0) {
          q.drain();
        }
        q.process();
      };
    }

    function runQueue() {
      while (!q.paused && workers < q.concurrency && q._tasks.length) {
        var task = q._tasks.shift();
        workers++;
        workersList.push(task);
        if (q._tasks.length === 0) {
          q.empty();
        }
        if (workers === q.concurrency) {
          q.saturated();
        }
        var done = _next(q, [task]);
        worker(task.data, done);
      }
    }

    function runCargo() {
      while (!q.paused && workers < q.concurrency && q._tasks.length) {
        var tasks = q._tasks.splice(q.payload || q._tasks.length);
        var index = -1;
        var size = tasks.length;
        var data = Array(size);
        while (++index < size) {
          data[index] = tasks[index].data;
        }
        workers++;
        nativePush.apply(workersList, tasks);
        if (q._tasks.length === 0) {
          q.empty();
        }
        if (workers === q.concurrency) {
          q.saturated();
        }
        var done = _next(q, tasks);
        worker(data, done);
      }
    }

    function getLength() {
      return q._tasks.length;
    }

    function running() {
      return workers;
    }

    function getWorkersList() {
      return workersList;
    }

    function idle() {
      return q.length() + workers === 0;
    }

    function pause() {
      q.paused = true;
    }

    function _resume() {
      nextTick(q.process);
    }

    function resume() {
      if (q.paused === false) {
        return;
      }
      q.paused = false;
      var count = q.concurrency < q._tasks.length ? q.concurrency : q._tasks.length;
      timesSync(count, _resume);
    }

    /**
     * @param {Function} test
     */
    function remove(test) {
      q._tasks.remove(test);
    }
  }

  /**
   * @memberof async
   * @namespace queue
   */
  function queue(worker, concurrency) {
    return baseQueue(true, worker, concurrency);
  }

  /**
   * @memberof async
   * @namespace priorityQueue
   */
  function priorityQueue(worker, concurrency) {
    var q = baseQueue(true, worker, concurrency);
    q.push = push;
    delete q.unshift;
    return q;

    function push(tasks, priority, callback) {
      q.started = true;
      priority = priority || 0;
      var _tasks = isArray(tasks) ? tasks : [tasks];
      var taskSize = _tasks.length;

      if (tasks === undefined || taskSize === 0) {
        if (q.idle()) {
          nextTick(q.drain);
        }
        return;
      }

      callback = typeof callback === func ? callback : noop;
      var nextNode = q._tasks.head;
      while (nextNode && priority >= nextNode.priority) {
        nextNode = nextNode.next;
      }
      while (taskSize--) {
        var item = {
          data: _tasks[taskSize],
          priority: priority,
          callback: callback
        };
        if (nextNode) {
          q._tasks.insertBefore(nextNode, item);
        } else {
          q._tasks.push(item);
        }
        nextTick(q.process);
      }
    }
  }

  /**
   * @memberof async
   * @namespace cargo
   */
  function cargo(worker, payload) {
    return baseQueue(false, worker, 1, payload);
  }

  /**
   * @memberof async
   * @namespace auto
   * @param {Object} tasks
   * @param {number} [concurrency]
   * @param {Function} [callback]
   */
  function auto(tasks, concurrency, callback) {
    if (typeof concurrency === func) {
      callback = concurrency;
      concurrency = null;
    }
    var keys = nativeKeys(tasks);
    var rest = keys.length;
    var results = {};
    if (rest === 0) {
      return callback(null, results);
    }
    var runningTasks = 0;
    var readyTasks = new DLL();
    var listeners = Object.create(null);
    callback = onlyOnce(callback || noop);
    concurrency = concurrency || rest;

    baseEachSync(tasks, iterator, keys);
    proceedQueue();

    function iterator(task, key) {
      // no dependencies
      var _task, _taskSize;
      if (!isArray(task)) {
        _task = task;
        _taskSize = 0;
        readyTasks.push([_task, _taskSize, done]);
        return;
      }
      var dependencySize = task.length - 1;
      _task = task[dependencySize];
      _taskSize = dependencySize;
      if (dependencySize === 0) {
        readyTasks.push([_task, _taskSize, done]);
        return;
      }
      // dependencies
      var index = -1;
      while (++index < dependencySize) {
        var dependencyName = task[index];
        if (notInclude(keys, dependencyName)) {
          var msg =
            'async.auto task `' +
            key +
            '` has non-existent dependency `' +
            dependencyName +
            '` in ' +
            task.join(', ');
          throw new Error(msg);
        }
        var taskListeners = listeners[dependencyName];
        if (!taskListeners) {
          taskListeners = listeners[dependencyName] = [];
        }
        taskListeners.push(taskListener);
      }

      function done(err, arg) {
        if (key === null) {
          throwError();
        }
        arg = arguments.length <= 2 ? arg : slice(arguments, 1);
        if (err) {
          rest = 0;
          runningTasks = 0;
          readyTasks.length = 0;
          var safeResults = objectClone(results);
          safeResults[key] = arg;
          key = null;
          var _callback = callback;
          callback = noop;
          _callback(err, safeResults);
          return;
        }
        runningTasks--;
        rest--;
        results[key] = arg;
        taskComplete(key);
        key = null;
      }

      function taskListener() {
        if (--dependencySize === 0) {
          readyTasks.push([_task, _taskSize, done]);
        }
      }
    }

    function proceedQueue() {
      if (readyTasks.length === 0 && runningTasks === 0) {
        if (rest !== 0) {
          throw new Error('async.auto task has cyclic dependencies');
        }
        return callback(null, results);
      }
      while (readyTasks.length && runningTasks < concurrency && callback !== noop) {
        runningTasks++;
        var array = readyTasks.shift();
        if (array[1] === 0) {
          array[0](array[2]);
        } else {
          array[0](results, array[2]);
        }
      }
    }

    function taskComplete(key) {
      var taskListeners = listeners[key] || [];
      arrayEachSync(taskListeners, function(task) {
        task();
      });
      proceedQueue();
    }
  }

  var FN_ARGS = /^(function)?\s*[^\(]*\(\s*([^\)]*)\)/m;
  var FN_ARG_SPLIT = /,/;
  var FN_ARG = /(=.+)?(\s*)$/;
  var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;

  /**
   * parse function arguments for `autoInject`
   *
   * @private
   */
  function parseParams(func) {
    func = func.toString().replace(STRIP_COMMENTS, '');
    func = func.match(FN_ARGS)[2].replace(' ', '');
    func = func ? func.split(FN_ARG_SPLIT) : [];
    func = func.map(function(arg) {
      return arg.replace(FN_ARG, '').trim();
    });
    return func;
  }

  /**
   * @memberof async
   * @namespace autoInject
   * @param {Object} tasks
   * @param {number} [concurrency]
   * @param {Function} [callback]
   */
  function autoInject(tasks, concurrency, callback) {
    var newTasks = {};
    baseEachSync(tasks, iterator, nativeKeys(tasks));
    auto(newTasks, concurrency, callback);

    function iterator(task, key) {
      var params;
      var taskLength = task.length;

      if (isArray(task)) {
        if (taskLength === 0) {
          throw new Error('autoInject task functions require explicit parameters.');
        }
        params = createArray(task);
        taskLength = params.length - 1;
        task = params[taskLength];
        if (taskLength === 0) {
          newTasks[key] = task;
          return;
        }
      } else if (taskLength === 1) {
        newTasks[key] = task;
        return;
      } else {
        params = parseParams(task);
        if (taskLength === 0 && params.length === 0) {
          throw new Error('autoInject task functions require explicit parameters.');
        }
        taskLength = params.length - 1;
      }
      params[taskLength] = newTask;
      newTasks[key] = params;

      function newTask(results, done) {
        switch (taskLength) {
          case 1:
            task(results[params[0]], done);
            break;
          case 2:
            task(results[params[0]], results[params[1]], done);
            break;
          case 3:
            task(results[params[0]], results[params[1]], results[params[2]], done);
            break;
          default:
            var i = -1;
            while (++i < taskLength) {
              params[i] = results[params[i]];
            }
            params[i] = done;
            task.apply(null, params);
            break;
        }
      }
    }
  }

  /**
   * @memberof async
   * @namespace retry
   * @param {integer|Object|Function} opts
   * @param {Function} [task]
   * @param {Function} [callback]
   */
  function retry(opts, task, callback) {
    var times, intervalFunc, errorFilter;
    var count = 0;
    if (arguments.length < 3 && typeof opts === func) {
      callback = task || noop;
      task = opts;
      opts = null;
      times = DEFAULT_TIMES;
    } else {
      callback = callback || noop;
      switch (typeof opts) {
        case 'object':
          if (typeof opts.errorFilter === func) {
            errorFilter = opts.errorFilter;
          }
          var interval = opts.interval;
          switch (typeof interval) {
            case func:
              intervalFunc = interval;
              break;
            case 'string':
            case 'number':
              interval = +interval;
              intervalFunc = interval
                ? function() {
                    return interval;
                  }
                : function() {
                    return DEFAULT_INTERVAL;
                  };
              break;
          }
          times = +opts.times || DEFAULT_TIMES;
          break;
        case 'number':
          times = opts || DEFAULT_TIMES;
          break;
        case 'string':
          times = +opts || DEFAULT_TIMES;
          break;
        default:
          throw new Error('Invalid arguments for async.retry');
      }
    }
    if (typeof task !== 'function') {
      throw new Error('Invalid arguments for async.retry');
    }

    if (intervalFunc) {
      task(intervalCallback);
    } else {
      task(simpleCallback);
    }

    function simpleIterator() {
      task(simpleCallback);
    }

    function simpleCallback(err, res) {
      if (++count === times || !err || (errorFilter && !errorFilter(err))) {
        if (arguments.length <= 2) {
          return callback(err, res);
        }
        var args = createArray(arguments);
        return callback.apply(null, args);
      }
      simpleIterator();
    }

    function intervalIterator() {
      task(intervalCallback);
    }

    function intervalCallback(err, res) {
      if (++count === times || !err || (errorFilter && !errorFilter(err))) {
        if (arguments.length <= 2) {
          return callback(err, res);
        }
        var args = createArray(arguments);
        return callback.apply(null, args);
      }
      setTimeout(intervalIterator, intervalFunc(count));
    }
  }

  function retryable(opts, task) {
    if (!task) {
      task = opts;
      opts = null;
    }
    return done;

    function done() {
      var taskFn;
      var args = createArray(arguments);
      var lastIndex = args.length - 1;
      var callback = args[lastIndex];
      switch (task.length) {
        case 1:
          taskFn = task1;
          break;
        case 2:
          taskFn = task2;
          break;
        case 3:
          taskFn = task3;
          break;
        default:
          taskFn = task4;
      }
      if (opts) {
        retry(opts, taskFn, callback);
      } else {
        retry(taskFn, callback);
      }

      function task1(done) {
        task(done);
      }

      function task2(done) {
        task(args[0], done);
      }

      function task3(done) {
        task(args[0], args[1], done);
      }

      function task4(callback) {
        args[lastIndex] = callback;
        task.apply(null, args);
      }
    }
  }

  /**
   * @memberof async
   * @namespace iterator
   */
  function iterator(tasks) {
    var size = 0;
    var keys = [];
    if (isArray(tasks)) {
      size = tasks.length;
    } else {
      keys = nativeKeys(tasks);
      size = keys.length;
    }
    return makeCallback(0);

    function makeCallback(index) {
      var fn = function() {
        if (size) {
          var key = keys[index] || index;
          tasks[key].apply(null, createArray(arguments));
        }
        return fn.next();
      };
      fn.next = function() {
        return index < size - 1 ? makeCallback(index + 1) : null;
      };
      return fn;
    }
  }

  /**
   * @memberof async
   * @namespace apply
   */
  function apply(func) {
    switch (arguments.length) {
      case 0:
      case 1:
        return func;
      case 2:
        return func.bind(null, arguments[1]);
      case 3:
        return func.bind(null, arguments[1], arguments[2]);
      case 4:
        return func.bind(null, arguments[1], arguments[2], arguments[3]);
      case 5:
        return func.bind(null, arguments[1], arguments[2], arguments[3], arguments[4]);
      default:
        var size = arguments.length;
        var index = 0;
        var args = Array(size);
        args[index] = null;
        while (++index < size) {
          args[index] = arguments[index];
        }
        return func.bind.apply(func, args);
    }
  }

  /**
   * @memberof async
   * @namespace timeout
   * @param {Function} func
   * @param {number} millisec
   * @param {*} info
   */
  function timeout(func, millisec, info) {
    var callback, timer;
    return wrappedFunc;

    function wrappedFunc() {
      timer = setTimeout(timeoutCallback, millisec);
      var args = createArray(arguments);
      var lastIndex = args.length - 1;
      callback = args[lastIndex];
      args[lastIndex] = injectedCallback;
      simpleApply(func, args);
    }

    function timeoutCallback() {
      var name = func.name || 'anonymous';
      var err = new Error('Callback function "' + name + '" timed out.');
      err.code = 'ETIMEDOUT';
      if (info) {
        err.info = info;
      }
      timer = null;
      callback(err);
    }

    function injectedCallback() {
      if (timer !== null) {
        simpleApply(callback, createArray(arguments));
        clearTimeout(timer);
      }
    }

    function simpleApply(func, args) {
      switch (args.length) {
        case 0:
          func();
          break;
        case 1:
          func(args[0]);
          break;
        case 2:
          func(args[0], args[1]);
          break;
        default:
          func.apply(null, args);
          break;
      }
    }
  }

  /**
   * @memberof async
   * @namespace times
   * @param {number} n - n >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * var iterator = function(n, done) {
   *   done(null, n);
   * };
   * async.times(4, iterator, function(err, res) {
   *   console.log(res); // [0, 1, 2, 3];
   * });
   *
   */
  function times(n, iterator, callback) {
    callback = callback || noop;
    n = +n;
    if (isNaN(n) || n < 1) {
      return callback(null, []);
    }
    var result = Array(n);
    timesSync(n, iterate);

    function iterate(num) {
      iterator(num, createCallback(num));
    }

    function createCallback(index) {
      return function(err, res) {
        if (index === null) {
          throwError();
        }
        result[index] = res;
        index = null;
        if (err) {
          callback(err);
          callback = noop;
        } else if (--n === 0) {
          callback(null, result);
        }
      };
    }
  }

  /**
   * @memberof async
   * @namespace timesSeries
   * @param {number} n - n >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * var iterator = function(n, done) {
   *   done(null, n);
   * };
   * async.timesSeries(4, iterator, function(err, res) {
   *   console.log(res); // [0, 1, 2, 3];
   * });
   *
   */
  function timesSeries(n, iterator, callback) {
    callback = callback || noop;
    n = +n;
    if (isNaN(n) || n < 1) {
      return callback(null, []);
    }
    var result = Array(n);
    var sync = false;
    var completed = 0;
    iterate();

    function iterate() {
      iterator(completed, done);
    }

    function done(err, res) {
      result[completed] = res;
      if (err) {
        callback(err);
        callback = throwError;
      } else if (++completed >= n) {
        callback(null, result);
        callback = throwError;
      } else if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace timesLimit
   * @param {number} n - n >= 1
   * @param {number} limit - n >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * var iterator = function(n, done) {
   *   done(null, n);
   * };
   * async.timesLimit(4, 2, iterator, function(err, res) {
   *   console.log(res); // [0, 1, 2, 3];
   * });
   *
   */
  function timesLimit(n, limit, iterator, callback) {
    callback = callback || noop;
    n = +n;
    if (isNaN(n) || n < 1 || isNaN(limit) || limit < 1) {
      return callback(null, []);
    }
    var result = Array(n);
    var sync = false;
    var started = 0;
    var completed = 0;
    timesSync(limit > n ? n : limit, iterate);

    function iterate() {
      var index = started++;
      if (index < n) {
        iterator(index, createCallback(index));
      }
    }

    function createCallback(index) {
      return function(err, res) {
        if (index === null) {
          throwError();
        }
        result[index] = res;
        index = null;
        if (err) {
          callback(err);
          callback = noop;
        } else if (++completed >= n) {
          callback(null, result);
          callback = throwError;
        } else if (sync) {
          nextTick(iterate);
        } else {
          sync = true;
          iterate();
        }
        sync = false;
      };
    }
  }

  /**
   * @memberof async
   * @namespace race
   * @param {Array|Object} tasks - functions
   * @param {Function} callback
   * @example
   *
   * // array
   * var called = 0;
   * var tasks = [
   *   function(done) {
   *     setTimeout(function() {
   *       called++;
   *       done(null, '1');
   *     }, 30);
   *   },
   *   function(done) {
   *     setTimeout(function() {
   *       called++;
   *       done(null, '2');
   *     }, 20);
   *   },
   *   function(done) {
   *     setTimeout(function() {
   *       called++;
   *       done(null, '3');
   *     }, 10);
   *   }
   * ];
   * async.race(tasks, function(err, res) {
   *   console.log(res); // '3'
   *   console.log(called); // 1
   *   setTimeout(function() {
   *     console.log(called); // 3
   *   }, 50);
   * });
   *
   * @example
   *
   * // object
   * var called = 0;
   * var tasks = {
   *   'test1': function(done) {
   *     setTimeout(function() {
   *       called++;
   *       done(null, '1');
   *     }, 30);
   *   },
   *   'test2': function(done) {
   *     setTimeout(function() {
   *       called++;
   *       done(null, '2');
   *     }, 20);
   *   },
   *   'test3': function(done) {
   *     setTimeout(function() {
   *       called++;
   *       done(null, '3');
   *     }, 10);
   *   }
   * };
   * async.race(tasks, function(err, res) {
   *   console.log(res); // '3'
   *   console.log(called); // 1
   *   setTimeout(function() {
   *     console.log(called); // 3
   *     done();
   *   }, 50);
   * });
   *
   */
  function race(tasks, callback) {
    callback = once(callback || noop);
    var size, keys;
    var index = -1;
    if (isArray(tasks)) {
      size = tasks.length;
      while (++index < size) {
        tasks[index](callback);
      }
    } else if (tasks && typeof tasks === obj) {
      keys = nativeKeys(tasks);
      size = keys.length;
      while (++index < size) {
        tasks[keys[index]](callback);
      }
    } else {
      return callback(new TypeError('First argument to race must be a collection of functions'));
    }
    if (!size) {
      callback(null);
    }
  }

  /**
   * @memberof async
   * @namespace memoize
   */
  function memoize(fn, hasher) {
    hasher =
      hasher ||
      function(hash) {
        return hash;
      };

    var memo = {};
    var queues = {};
    var memoized = function() {
      var args = createArray(arguments);
      var callback = args.pop();
      var key = hasher.apply(null, args);
      if (has(memo, key)) {
        nextTick(function() {
          callback.apply(null, memo[key]);
        });
        return;
      }
      if (has(queues, key)) {
        return queues[key].push(callback);
      }

      queues[key] = [callback];
      args.push(done);
      fn.apply(null, args);

      function done(err) {
        var args = createArray(arguments);
        if (!err) {
          memo[key] = args;
        }
        var q = queues[key];
        delete queues[key];

        var i = -1;
        var size = q.length;
        while (++i < size) {
          q[i].apply(null, args);
        }
      }
    };
    memoized.memo = memo;
    memoized.unmemoized = fn;
    return memoized;
  }

  /**
   * @memberof async
   * @namespace unmemoize
   */
  function unmemoize(fn) {
    return function() {
      return (fn.unmemoized || fn).apply(null, arguments);
    };
  }

  /**
   * @memberof async
   * @namespace ensureAsync
   */
  function ensureAsync(fn) {
    return function(/* ...args, callback */) {
      var args = createArray(arguments);
      var lastIndex = args.length - 1;
      var callback = args[lastIndex];
      var sync = true;
      args[lastIndex] = done;
      fn.apply(this, args);
      sync = false;

      function done() {
        var innerArgs = createArray(arguments);
        if (sync) {
          nextTick(function() {
            callback.apply(null, innerArgs);
          });
        } else {
          callback.apply(null, innerArgs);
        }
      }
    };
  }

  /**
   * @memberof async
   * @namespace constant
   */
  function constant(/* values... */) {
    var args = [null].concat(createArray(arguments));
    return function(callback) {
      callback = arguments[arguments.length - 1];
      callback.apply(this, args);
    };
  }

  function asyncify(fn) {
    return function(/* args..., callback */) {
      var args = createArray(arguments);
      var callback = args.pop();
      var result;
      try {
        result = fn.apply(this, args);
      } catch (e) {
        return callback(e);
      }
      if (result && typeof result.then === func) {
        result.then(
          function(value) {
            invokeCallback(callback, null, value);
          },
          function(err) {
            invokeCallback(callback, err && err.message ? err : new Error(err));
          }
        );
      } else {
        callback(null, result);
      }
    };
  }

  function invokeCallback(callback, err, value) {
    try {
      callback(err, value);
    } catch (e) {
      nextTick(rethrow, e);
    }
  }

  function rethrow(error) {
    throw error;
  }

  /**
   * @memberof async
   * @namespace reflect
   * @param {Function} func
   * @return {Function}
   */
  function reflect(func) {
    return function(/* args..., callback */) {
      var callback;
      switch (arguments.length) {
        case 1:
          callback = arguments[0];
          return func(done);
        case 2:
          callback = arguments[1];
          return func(arguments[0], done);
        default:
          var args = createArray(arguments);
          var lastIndex = args.length - 1;
          callback = args[lastIndex];
          args[lastIndex] = done;
          func.apply(this, args);
      }

      function done(err, res) {
        if (err) {
          return callback(null, {
            error: err
          });
        }
        if (arguments.length > 2) {
          res = slice(arguments, 1);
        }
        callback(null, {
          value: res
        });
      }
    };
  }

  /**
   * @memberof async
   * @namespace reflectAll
   * @param {Array[]|Object} tasks
   * @return {Function}
   */
  function reflectAll(tasks) {
    var newTasks, keys;
    if (isArray(tasks)) {
      newTasks = Array(tasks.length);
      arrayEachSync(tasks, iterate);
    } else if (tasks && typeof tasks === obj) {
      keys = nativeKeys(tasks);
      newTasks = {};
      baseEachSync(tasks, iterate, keys);
    }
    return newTasks;

    function iterate(func, key) {
      newTasks[key] = reflect(func);
    }
  }

  /**
   * @memberof async
   * @namespace createLogger
   */
  function createLogger(name) {
    return function(fn) {
      var args = slice(arguments, 1);
      args.push(done);
      fn.apply(null, args);
    };

    function done(err) {
      if (typeof console === obj) {
        if (err) {
          if (console.error) {
            console.error(err);
          }
          return;
        }
        if (console[name]) {
          var args = slice(arguments, 1);
          arrayEachSync(args, function(arg) {
            console[name](arg);
          });
        }
      }
    }
  }

  /**
   * @memberof async
   * @namespace safe
   */
  function safe() {
    createImmediate();
    return exports;
  }

  /**
   * @memberof async
   * @namespace fast
   */
  function fast() {
    createImmediate(false);
    return exports;
  }
});


/***/ }),

/***/ 73:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


module.exports = __nccwpck_require__(117).mapSeries;


/***/ }),

/***/ 605:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


module.exports = __nccwpck_require__(117).queue;


/***/ }),

/***/ 578:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = void 0;

const stack = (err, worker, workerId) => {
  const originError = (err.stack || '').split('\n').filter(line => line.trim().startsWith('at'));
  const workerError = worker.split('\n').filter(line => line.trim().startsWith('at'));
  const diff = workerError.slice(0, workerError.length - originError.length).join('\n');
  originError.unshift(diff);
  originError.unshift(err.message);
  originError.unshift(`Thread Loader (Worker ${workerId})`);
  return originError.join('\n');
};

class WorkerError extends Error {
  constructor(err, workerId) {
    super(err);
    this.name = err.name;
    this.message = err.message;
    Error.captureStackTrace(this, this.constructor);
    this.stack = stack(err, this.stack, workerId);
  }

}

var _default = WorkerError;
exports.default = _default;

/***/ }),

/***/ 524:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = void 0;

var _child_process = _interopRequireDefault(__nccwpck_require__(129));

var _queue = _interopRequireDefault(__nccwpck_require__(605));

var _mapSeries = _interopRequireDefault(__nccwpck_require__(73));

var _readBuffer = _interopRequireDefault(__nccwpck_require__(301));

var _WorkerError = _interopRequireDefault(__nccwpck_require__(578));

var _serializer = __nccwpck_require__(835);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable no-console */
const workerPath = __nccwpck_require__.ab + "worker.js";

let workerId = 0;

class PoolWorker {
  constructor(options, onJobDone) {
    this.disposed = false;
    this.nextJobId = 0;
    this.jobs = Object.create(null);
    this.activeJobs = 0;
    this.onJobDone = onJobDone;
    this.id = workerId;
    workerId += 1; // Empty or invalid node args would break the child process

    const sanitizedNodeArgs = (options.nodeArgs || []).filter(opt => !!opt);
    this.worker = _child_process.default.spawn(process.execPath, [].concat(sanitizedNodeArgs).concat(__nccwpck_require__.ab + "worker.js", options.parallelJobs), {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe', 'pipe', 'pipe']
    });
    this.worker.unref(); // This prevents a problem where the worker stdio can be undefined
    // when the kernel hits the limit of open files.
    // More info can be found on: https://github.com/webpack-contrib/thread-loader/issues/2

    if (!this.worker.stdio) {
      throw new Error(`Failed to create the worker pool with workerId: ${workerId} and ${''}configuration: ${JSON.stringify(options)}. Please verify if you hit the OS open files limit.`);
    }

    const [,,, readPipe, writePipe] = this.worker.stdio;
    this.readPipe = readPipe;
    this.writePipe = writePipe;
    this.listenStdOutAndErrFromWorker(this.worker.stdout, this.worker.stderr);
    this.readNextMessage();
  }

  listenStdOutAndErrFromWorker(workerStdout, workerStderr) {
    if (workerStdout) {
      workerStdout.on('data', this.writeToStdout);
    }

    if (workerStderr) {
      workerStderr.on('data', this.writeToStderr);
    }
  }

  ignoreStdOutAndErrFromWorker(workerStdout, workerStderr) {
    if (workerStdout) {
      workerStdout.removeListener('data', this.writeToStdout);
    }

    if (workerStderr) {
      workerStderr.removeListener('data', this.writeToStderr);
    }
  }

  writeToStdout(data) {
    if (!this.disposed) {
      process.stdout.write(data);
    }
  }

  writeToStderr(data) {
    if (!this.disposed) {
      process.stderr.write(data);
    }
  }

  run(data, callback) {
    const jobId = this.nextJobId;
    this.nextJobId += 1;
    this.jobs[jobId] = {
      data,
      callback
    };
    this.activeJobs += 1;
    this.writeJson({
      type: 'job',
      id: jobId,
      data
    });
  }

  warmup(requires) {
    this.writeJson({
      type: 'warmup',
      requires
    });
  }

  writeJson(data) {
    const lengthBuffer = Buffer.alloc(4);
    const messageBuffer = Buffer.from(JSON.stringify(data, _serializer.replacer), 'utf-8');
    lengthBuffer.writeInt32BE(messageBuffer.length, 0);
    this.writePipe.write(lengthBuffer);
    this.writePipe.write(messageBuffer);
  }

  writeEnd() {
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeInt32BE(0, 0);
    this.writePipe.write(lengthBuffer);
  }

  readNextMessage() {
    this.state = 'read length';
    this.readBuffer(4, (lengthReadError, lengthBuffer) => {
      if (lengthReadError) {
        console.error(`Failed to communicate with worker (read length) ${lengthReadError}`);
        return;
      }

      this.state = 'length read';
      const length = lengthBuffer.readInt32BE(0);
      this.state = 'read message';
      this.readBuffer(length, (messageError, messageBuffer) => {
        if (messageError) {
          console.error(`Failed to communicate with worker (read message) ${messageError}`);
          return;
        }

        this.state = 'message read';
        const messageString = messageBuffer.toString('utf-8');
        const message = JSON.parse(messageString, _serializer.reviver);
        this.state = 'process message';
        this.onWorkerMessage(message, err => {
          if (err) {
            console.error(`Failed to communicate with worker (process message) ${err}`);
            return;
          }

          this.state = 'soon next';
          setImmediate(() => this.readNextMessage());
        });
      });
    });
  }

  onWorkerMessage(message, finalCallback) {
    const {
      type,
      id
    } = message;

    switch (type) {
      case 'job':
        {
          const {
            data,
            error,
            result
          } = message;
          (0, _mapSeries.default)(data, (length, callback) => this.readBuffer(length, callback), (eachErr, buffers) => {
            const {
              callback: jobCallback
            } = this.jobs[id];

            const callback = (err, arg) => {
              if (jobCallback) {
                delete this.jobs[id];
                this.activeJobs -= 1;
                this.onJobDone();

                if (err) {
                  jobCallback(err instanceof Error ? err : new Error(err), arg);
                } else {
                  jobCallback(null, arg);
                }
              }

              finalCallback();
            };

            if (eachErr) {
              callback(eachErr);
              return;
            }

            let bufferPosition = 0;

            if (result.result) {
              result.result = result.result.map(r => {
                if (r.buffer) {
                  const buffer = buffers[bufferPosition];
                  bufferPosition += 1;

                  if (r.string) {
                    return buffer.toString('utf-8');
                  }

                  return buffer;
                }

                return r.data;
              });
            }

            if (error) {
              callback(this.fromErrorObj(error), result);
              return;
            }

            callback(null, result);
          });
          break;
        }

      case 'loadModule':
        {
          const {
            request,
            questionId
          } = message;
          const {
            data
          } = this.jobs[id]; // eslint-disable-next-line no-unused-vars

          data.loadModule(request, (error, source, sourceMap, module) => {
            this.writeJson({
              type: 'result',
              id: questionId,
              error: error ? {
                message: error.message,
                details: error.details,
                missing: error.missing
              } : null,
              result: [source, sourceMap // TODO: Serialize module?
              // module,
              ]
            });
          });
          finalCallback();
          break;
        }

      case 'resolve':
        {
          const {
            context,
            request,
            options,
            questionId
          } = message;
          const {
            data
          } = this.jobs[id];

          if (options) {
            data.getResolve(options)(context, request, (error, result) => {
              this.writeJson({
                type: 'result',
                id: questionId,
                error: error ? {
                  message: error.message,
                  details: error.details,
                  missing: error.missing
                } : null,
                result
              });
            });
          } else {
            data.resolve(context, request, (error, result) => {
              this.writeJson({
                type: 'result',
                id: questionId,
                error: error ? {
                  message: error.message,
                  details: error.details,
                  missing: error.missing
                } : null,
                result
              });
            });
          }

          finalCallback();
          break;
        }

      case 'emitWarning':
        {
          const {
            data
          } = message;
          const {
            data: jobData
          } = this.jobs[id];
          jobData.emitWarning(this.fromErrorObj(data));
          finalCallback();
          break;
        }

      case 'emitError':
        {
          const {
            data
          } = message;
          const {
            data: jobData
          } = this.jobs[id];
          jobData.emitError(this.fromErrorObj(data));
          finalCallback();
          break;
        }

      default:
        {
          console.error(`Unexpected worker message ${type} in WorkerPool.`);
          finalCallback();
          break;
        }
    }
  }

  fromErrorObj(arg) {
    let obj;

    if (typeof arg === 'string') {
      obj = {
        message: arg
      };
    } else {
      obj = arg;
    }

    return new _WorkerError.default(obj, this.id);
  }

  readBuffer(length, callback) {
    (0, _readBuffer.default)(this.readPipe, length, callback);
  }

  dispose() {
    if (!this.disposed) {
      this.disposed = true;
      this.ignoreStdOutAndErrFromWorker(this.worker.stdout, this.worker.stderr);
      this.writeEnd();
    }
  }

}

class WorkerPool {
  constructor(options) {
    this.options = options || {};
    this.numberOfWorkers = options.numberOfWorkers;
    this.poolTimeout = options.poolTimeout;
    this.workerNodeArgs = options.workerNodeArgs;
    this.workerParallelJobs = options.workerParallelJobs;
    this.workers = new Set();
    this.activeJobs = 0;
    this.timeout = null;
    this.poolQueue = (0, _queue.default)(this.distributeJob.bind(this), options.poolParallelJobs);
    this.terminated = false;
    this.setupLifeCycle();
  }

  isAbleToRun() {
    return !this.terminated;
  }

  terminate() {
    if (this.terminated) {
      return;
    }

    this.terminated = true;
    this.poolQueue.kill();
    this.disposeWorkers(true);
  }

  setupLifeCycle() {
    process.on('exit', () => {
      this.terminate();
    });
  }

  run(data, callback) {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    this.activeJobs += 1;
    this.poolQueue.push(data, callback);
  }

  distributeJob(data, callback) {
    // use worker with the fewest jobs
    let bestWorker;

    for (const worker of this.workers) {
      if (!bestWorker || worker.activeJobs < bestWorker.activeJobs) {
        bestWorker = worker;
      }
    }

    if (bestWorker && (bestWorker.activeJobs === 0 || this.workers.size >= this.numberOfWorkers)) {
      bestWorker.run(data, callback);
      return;
    }

    const newWorker = this.createWorker();
    newWorker.run(data, callback);
  }

  createWorker() {
    // spin up a new worker
    const newWorker = new PoolWorker({
      nodeArgs: this.workerNodeArgs,
      parallelJobs: this.workerParallelJobs
    }, () => this.onJobDone());
    this.workers.add(newWorker);
    return newWorker;
  }

  warmup(requires) {
    while (this.workers.size < this.numberOfWorkers) {
      this.createWorker().warmup(requires);
    }
  }

  onJobDone() {
    this.activeJobs -= 1;

    if (this.activeJobs === 0 && isFinite(this.poolTimeout)) {
      this.timeout = setTimeout(() => this.disposeWorkers(), this.poolTimeout);
    }
  }

  disposeWorkers(fromTerminate) {
    if (!this.options.poolRespawn && !fromTerminate) {
      this.terminate();
      return;
    }

    if (this.activeJobs === 0 || fromTerminate) {
      for (const worker of this.workers) {
        worker.dispose();
      }

      this.workers.clear();
    }
  }

}

exports.default = WorkerPool;

/***/ }),

/***/ 463:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


module.exports = __nccwpck_require__(418);

/***/ }),

/***/ 418:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.pitch = pitch;
exports.warmup = warmup;

var _loaderUtils = _interopRequireDefault(__nccwpck_require__(432));

var _workerPools = __nccwpck_require__(688);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function pitch() {
  const options = _loaderUtils.default.getOptions(this);

  const workerPool = (0, _workerPools.getPool)(options);

  if (!workerPool.isAbleToRun()) {
    return;
  }

  const callback = this.async();
  workerPool.run({
    loaders: this.loaders.slice(this.loaderIndex + 1).map(l => {
      return {
        loader: l.path,
        options: l.options,
        ident: l.ident
      };
    }),
    resource: this.resourcePath + (this.resourceQuery || ''),
    sourceMap: this.sourceMap,
    emitError: this.emitError,
    emitWarning: this.emitWarning,
    loadModule: this.loadModule,
    resolve: this.resolve,
    getResolve: this.getResolve,
    target: this.target,
    minimize: this.minimize,
    resourceQuery: this.resourceQuery,
    optionsContext: this.rootContext || this.options.context,
    rootContext: this.rootContext
  }, (err, r) => {
    if (r) {
      r.fileDependencies.forEach(d => this.addDependency(d));
      r.contextDependencies.forEach(d => this.addContextDependency(d));
      r.missingDependencies.forEach(d => this.addMissingDependency(d));
      r.buildDependencies.forEach(d => // Compatibility with webpack v4
      this.addBuildDependency ? this.addBuildDependency(d) : this.addDependency(d));
    }

    if (err) {
      callback(err);
      return;
    }

    callback(null, ...r.result);
  });
}

function warmup(options, requires) {
  const workerPool = (0, _workerPools.getPool)(options);
  workerPool.warmup(requires);
} // eslint-disable-line import/prefer-default-export

/***/ }),

/***/ 301:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = readBuffer;

function readBuffer(pipe, length, callback) {
  if (length === 0) {
    callback(null, Buffer.alloc(0));
    return;
  }

  let remainingLength = length;
  const buffers = [];

  const readChunk = () => {
    const onChunk = arg => {
      let chunk = arg;
      let overflow;

      if (chunk.length > remainingLength) {
        overflow = chunk.slice(remainingLength);
        chunk = chunk.slice(0, remainingLength);
        remainingLength = 0;
      } else {
        remainingLength -= chunk.length;
      }

      buffers.push(chunk);

      if (remainingLength === 0) {
        pipe.removeListener('data', onChunk);
        pipe.pause();

        if (overflow) {
          pipe.unshift(overflow);
        }

        callback(null, Buffer.concat(buffers, length));
      }
    };

    pipe.on('data', onChunk);
    pipe.resume();
  };

  readChunk();
}

/***/ }),

/***/ 835:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.replacer = replacer;
exports.reviver = reviver;

function replacer(_key, value) {
  if (value instanceof RegExp) {
    return {
      __serialized_type: 'RegExp',
      source: value.source,
      flags: value.flags
    };
  }

  return value;
}

function reviver(_key, value) {
  if (typeof value === 'object' && value !== null) {
    // eslint-disable-next-line no-underscore-dangle
    if (value.__serialized_type === 'RegExp') {
      return new RegExp(value.source, value.flags);
    }
  }

  return value;
}

/***/ }),

/***/ 688:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.getPool = getPool;

var _os = _interopRequireDefault(__nccwpck_require__(87));

var _WorkerPool = _interopRequireDefault(__nccwpck_require__(524));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const workerPools = Object.create(null);

function calculateNumberOfWorkers() {
  // There are situations when this call will return undefined so
  // we are fallback here to 1.
  // More info on: https://github.com/nodejs/node/issues/19022
  const cpus = _os.default.cpus() || {
    length: 1
  };
  return Math.max(1, cpus.length - 1);
}

function getPool(options) {
  const workerPoolOptions = {
    name: options.name || '',
    numberOfWorkers: options.workers || calculateNumberOfWorkers(),
    workerNodeArgs: options.workerNodeArgs,
    workerParallelJobs: options.workerParallelJobs || 20,
    poolTimeout: options.poolTimeout || 500,
    poolParallelJobs: options.poolParallelJobs || 200,
    poolRespawn: options.poolRespawn || false
  };
  const tpKey = JSON.stringify(workerPoolOptions);
  workerPools[tpKey] = workerPools[tpKey] || new _WorkerPool.default(workerPoolOptions);
  return workerPools[tpKey];
} // eslint-disable-line import/prefer-default-export

/***/ }),

/***/ 129:
/***/ ((module) => {

"use strict";
module.exports = require("child_process");

/***/ }),

/***/ 417:
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ 87:
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),

/***/ 622:
/***/ ((module) => {

"use strict";
module.exports = require("path");

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
/******/ 	// This entry module used 'module' so it can't be inlined
/******/ 	var __webpack_exports__ = __nccwpck_require__(463);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;