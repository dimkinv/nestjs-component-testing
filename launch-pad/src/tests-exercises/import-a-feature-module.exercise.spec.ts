describe('TestingModule exercise: import a feature module', () => {
  it.skip('imports a narrower feature module instead of AppModule', async () => {
    // This repo does not have a dedicated FavouritesModule or LaunchesModule yet.
    // Step 1: create a feature module for the slice you want to test.
    // Step 2: move the matching controller/providers into that module.
    // Step 3: in this test, import only that feature module with Test.createTestingModule().
    // Step 4: compile the module and get the service you care about from moduleRef.
    // Step 5: call one public method, such as FavouritesService.getFavorites('user-1').
    // Assert the returned shape without booting the whole application.
  });
});