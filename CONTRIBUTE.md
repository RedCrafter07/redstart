[<- Back](./README.md)

# Contributing

To add a module, put it into [src/modules](./src/modules/). After that, grab the [usage/example file](./usage/example.md) and write the usage of your module into [./usage/<modulename>.md](./usage/). For @install/make, that would be ./usage/@install/make.md. Add the name with the file path to [usage/index](./usage/index.md).

## Installing dependencies:

1. Fork [RedCrafter07/redstart](https://github.com/RedCrafter07/redstart)
2. Copy the repository `git clone https://github.com/<your-github-username>/redstart`
3. Change directory `cd redstart`
4. Open it in your editor. Example: `code .`
5. Run the install command: `npm install`, `pnpm install` or `yarn install`
6. Code your module
7. Try building redstart: `npm run build`, `pnpm build` or `yarn build`
8. Test your module by modifying [examples/example.rsproj](./examples/example.rsproj)
9. Run redstart: `node ./src/bin/index.js ./examples`
10. If everything went well, create a example .rsproj file in examples/
11. commit your changes: `git add .`, `git commit -m "Added <modulename>"` and `git push`
12. Go to your redstart fork
13. Click on "Contribute" and then on "Open Pull Request"
14. Document the changes and click on "Create Pull Request".

## Contributing a .rsproj template

1. Repeat steps 1 - 5
2. Create a file with your template name and .rsproj in src/templates/. Important: It can't contain '/' or '\'
3. Define your variables on the first line. They can't contain '.' and '|'. If you have multiple variables, use the '|' as a delimiter. Example: `a|b|c`
4. Below that, write the template .rsproj file. To use your variables, write `{variablename}`. Example: `{a}`
5. Compile a local version of redstart: `npm run build`, `pnpm build` or `yarn build`
6. Use that version to create a template: `node ./src/bin/index.js -t`
7. Fill in values, and check if the created file matches the expectations. If not, change the template file
8. Delete all test-files
9. Commit your changes: `git add .`, `git commit -m "Added template <templatename>"` and `git push`
10. Go to your redstart fork
11. Click on "Contribute" and then on "Open Pull Request"
12. Document the changes and click on "Create Pull Request"
