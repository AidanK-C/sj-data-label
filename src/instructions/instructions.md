# Product Requirements Document (PRD)
## Web Application: HITL (Human-in-the-Loop) CSV Review Tool

### 1. Objective

The HITL web application allows users to upload a `.csv` file, review it row by row, select one of three outputs (from the last three columns), provide a response, and save the results in a new `.csv` file. The application will streamline human-in-the-loop workflows by providing a simple, user-friendly interface.

### 2. Features and Functionality

#### 2.1 Authentication

* Users must log in to access the application via the log-in page, which is already included in the project as the (auth) folder and layout.tsx.  Do not alter this code.

#### 2.2 Upload Page

* Users can upload `.csv` files with proper format validation, receiving confirmation of successful upload or error messages for invalid files.

#### 2.3 Review Page

* **Row-by-Row Review**
  * Display one row of the uploaded `.csv` file at a time
  * Provide fields for viewing all columns in the row, selecting one of three outputs (from the last three columns), and typing a custom response
  * Include navigation buttons ("Next", "Previous", "Save & Exit")

* **Save Responses**
  * Store the selected output and typed response alongside the original row data
  * Save reviewed data to a temporary state until explicitly saved by the user

#### 2.4 Save Results

* Allow users to export reviewed rows as a new `.csv` file, including all original columns, the selected output, and the user's response

### 3. User Flow

1. **Log In**
   * User accesses the application and logs in via the login page

2. **Upload CSV File**
   * User is directed to the upload page and selects a `.csv` file
   * The application validates and uploads the file

3. **Row Review**
   * User is taken to the review page
   * Rows are displayed one at a time, and users can:
     * View the full row
     * Select one of three outputs from the last three columns
     * Provide a custom response
     * Navigate through rows using Next/Previous buttons

4. **Save and Export**
   * User saves progress
   * User exports the reviewed data as a new `.csv` file

5. **Current File Structure**
   *data-label
   ├── README.md
   ├── app
   │   ├── (auth)
   │   ├── favicon.ico
   │   ├── fonts
   │   ├── globals.css
   │   ├── layout.tsx
   │   └── page.tsx
   ├── components.json
   ├── instructions
   │   └── instructions.md
   ├── lib
   │   └── utils.ts
   ├── middleware.ts
   ├── next-env.d.ts
   ├── next.config.mjs
   ├── package-lock.json
   ├── package.json
   ├── postcss.config.mjs
   ├── tailwind.config.ts
   └── tsconfig.json