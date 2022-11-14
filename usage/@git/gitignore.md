[<- Back](../index.md)

## @git/gitignore

Configure the .gitignore file

### Usage

**Required fields:**

- language
> The language you intent on writing your program in. It will select the preset for the language. Leave empty to use none
>
> Supported values: javascript, js, typescript, ts

**Optional Fields:**

- additional
> The additional .gitignore values. Type: Array
>
> Example:
> ```
> additional: *.mjs, .rscache
>```