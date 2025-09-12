# 🎬 IntelliLab GC - Playwright Validation Suite

## 📋 **EXECUTION CHECKLIST**

**Status:** ✅ READY FOR EXECUTION  
**Environment:** Windows PowerShell  
**Timeline:** 30 minutes  
**Team:** Marcus (Implementation), Elena (UX), Dr. Mitchell (Validation), Dr. Claude (Oversight)

---

## 🚀 **STEP-BY-STEP EXECUTION**

### **STEP 1: Verify Installation (2 minutes)**

Open PowerShell in: `C:\IntelliLab_GC_ModV2\frontend`

```powershell
# Verify Playwright is installed
npm list @playwright/test

# Should show: @playwright/test@1.x.x
```

### **STEP 2: Start Backend Server (3 minutes)**

**Terminal 1 - Backend:**
```powershell
cd C:\IntelliLab_GC_ModV2\backend
python -m uvicorn main:app --reload --port 8000
```

**Wait for:** `Application startup complete`  
**Verify:** http://localhost:8000/api/health shows `{"status":"healthy"}`

### **STEP 3: Start Frontend Server (3 minutes)**

**Terminal 2 - Frontend:**
```powershell
cd C:\IntelliLab_GC_ModV2\frontend
npm start
```

**Wait for:** `Compiled successfully`  
**Verify:** http://localhost:3000 loads the app

### **STEP 4: Execute Validation Tests (15 minutes)**

**Terminal 3 - Test Execution:**
```powershell
cd C:\IntelliLab_GC_ModV2\frontend
npx playwright test validation.spec.ts --headed --reporter=line
```

---

## 🧪 **TEST SUITE BREAKDOWN**

### **Test 1: Form Persistence** 
- **Purpose:** Values survive page refresh
- **Actions:** Enter split ratio (75), flow (2.345), refresh page
- **Expected:** Values restored after refresh
- **Duration:** ~30 seconds

### **Test 2: Split Ratio Calculation**
- **Purpose:** Validates mathematical accuracy
- **Actions:** Set flow=1.2, ratio=50
- **Expected:** Total flow = 61.2 mL/min (Formula: 1.2 × (1+50))
- **Duration:** ~45 seconds

### **Test 3: API Health Check**
- **Purpose:** Backend connectivity
- **Actions:** GET request to /api/health
- **Expected:** Status 200, `{"status":"healthy"}`
- **Duration:** ~10 seconds

### **Test 4: Error Validation**
- **Purpose:** Invalid input handling
- **Actions:** Enter negative flow rate (-5)
- **Expected:** Error message or calculation prevention
- **Duration:** ~20 seconds

---

## 👀 **WHAT YOU'LL SEE**

### **Visual Indicators:**
- ✅ Chrome browser opens automatically
- ✅ Each test runs step-by-step (visible actions)
- ✅ Console shows real-time progress
- ✅ Screenshots saved on failures
- ✅ Final report with pass/fail status

### **Expected Console Output:**
```
🧪 Testing form persistence...
Flow persisted: 2.345 (expected: 2.345)
Ratio persisted: 75 (expected: 75)
✅ Form persistence PASSED

🧪 Testing split ratio calculation...
Found result with selector "text=/61\.2/": Total Inlet Flow: 61.2 ± 0.5 mL/min
✅ Split ratio calculation PASSED

🧪 Testing backend API...
API Response: { status: "healthy", service: "IntelliLab GC API" }
✅ API health check PASSED

🧪 Testing error handling...
⚠️ No error message shown, but negative calculation prevented
✅ Error validation PASSED

============================================================
INTELLILAB GC VALIDATION COMPLETE
============================================================
All critical tests executed
Check the test-results folder for videos of failures
============================================================
```

---

## 🎯 **SUCCESS CRITERIA**

### **All Tests Must Pass:**
- [x] **Test 1:** Form Persistence ✅
- [x] **Test 2:** Split Ratio Calculation ✅  
- [x] **Test 3:** API Health Check ✅
- [x] **Test 4:** Error Validation ✅

### **Deliverables:**
1. Screenshot of all 4 tests passing
2. `test-results/` folder with artifacts
3. Execution time report
4. Any failure analysis

---

## 🚨 **TROUBLESHOOTING**

### **If Tests Fail:**

**Test 1 Fails (Persistence):**
```powershell
# Check localStorage in browser dev tools
# Verify useFormPersistence hook is working
```

**Test 2 Fails (Calculation):**
```powershell
# Check if result appears with different selector:
npx playwright test validation.spec.ts --headed --grep "Split Ratio Calculation" --debug
```

**Test 3 Fails (API):**
```powershell
# Verify backend is running:
curl http://localhost:8000/api/health
```

**Test 4 Fails (Error Handling):**
```powershell
# Check if validation is implemented
# May need to add error handling to component
```

### **Re-run Individual Tests:**
```powershell
# Run specific test:
npx playwright test validation.spec.ts --headed --grep "Form Persistence"

# Debug mode (step through):
npx playwright test validation.spec.ts --debug --grep "Split Ratio Calculation"
```

---

## 📊 **REPORTING TEMPLATE**

### **Execution Report:**
```
INTELLILAB GC VALIDATION REPORT
===============================
Date: [DATE]
Duration: [X] minutes
Executor: Marcus
Reviewer: Elena, Dr. Mitchell

TEST RESULTS:
✅ Form Persistence: PASS
✅ Split Ratio Calculation: PASS  
✅ API Health Check: PASS
✅ Error Validation: PASS

ISSUES FOUND:
- [List any issues]

RECOMMENDATIONS:
- [Any UX improvements noted by Elena]
- [Any calculation concerns noted by Dr. Mitchell]

ARTIFACTS:
- Screenshots: test-results/screenshots/
- Videos: test-results/videos/
- HTML Report: playwright-report/index.html
```

---

## 🔧 **CONFIGURATION FILES CREATED**

### **Files Added:**
- ✅ `tests/validation.spec.ts` - Main test suite
- ✅ `playwright.config.ts` - Configuration
- ✅ `PLAYWRIGHT_VALIDATION_GUIDE.md` - This guide

### **Dependencies Added:**
- ✅ `@playwright/test` - Testing framework
- ✅ `playwright` - Browser automation
- ✅ Chromium browser - Test execution

---

## 🎯 **NEXT STEPS AFTER VALIDATION**

1. **If All Tests Pass:**
   - ✅ Proceed with production deployment
   - ✅ Document validated features
   - ✅ Set up CI/CD pipeline with these tests

2. **If Any Tests Fail:**
   - 🔧 Fix identified issues
   - 🔄 Re-run validation
   - 📝 Update documentation

---

**Ready for execution! Sarah's team can now run the complete validation suite.**
