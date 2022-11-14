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
10. If everything went well, commit your changes: `git add .`, `git commit -m "Added <modulename>"` and `git push`
11. Go to your redstart fork
12. Click on "Contribute" and then on "Open Pull Request"
13. Document the changes and click on "Create Pull Request"
