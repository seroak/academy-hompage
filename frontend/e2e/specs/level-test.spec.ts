import { test, expect } from '@playwright/test'
import { LevelTestPagePO } from '../pages/LevelTestPage'
import { routeByMethod, fulfillJson, apiPattern } from '../helpers/intercept'
import { PARENT_STORAGE_STATE } from '../helpers/authPaths'
import quizFixture from '../fixtures/level-test-quiz.json' with { type: 'json' }

test.describe('레벨테스트 응시', () => {
  test.use({ storageState: PARENT_STORAGE_STATE })

  test.beforeEach(async ({ page }) => {
    await routeByMethod(page, apiPattern('/level-tests/quiz'), {
      GET: (route) => fulfillJson(route, 200, quizFixture),
    })
    await routeByMethod(page, apiPattern('/level-tests/results$'), {
      POST: async (route) => {
        const input = route.request().postDataJSON()
        await fulfillJson(route, 201, {
          id: 'level-test-result-e2e-1',
          parentUserId: 'e2e-parent-1',
          parentUser: { id: 'e2e-parent-1', name: 'E2E 학부모', email: 'parent.e2e@example.com' },
          childName: input.childName,
          childAge: input.childAge,
          answers: input.answers.map((answer: { questionId: string; selectedChoiceIndex?: number; textAnswer?: string }) => ({
            questionId: answer.questionId,
            type: answer.selectedChoiceIndex !== undefined ? 'MULTIPLE_CHOICE' : 'SHORT_ANSWER',
            prompt: quizFixture.find((q) => q.id === answer.questionId)?.prompt ?? '',
            promptImageUrl: null,
            choices: quizFixture.find((q) => q.id === answer.questionId)?.choices ?? [],
            correctChoiceIndex: null,
            selectedChoiceIndex: answer.selectedChoiceIndex ?? null,
            textAnswer: answer.textAnswer ?? null,
            correct: answer.selectedChoiceIndex === 1,
          })),
          score: 1,
          scorableCount: 1,
          createdAt: new Date().toISOString(),
        })
      },
    })
  })

  test('문제를 풀고 제출하면 채점 결과가 보인다', async ({ page }) => {
    const levelTest = new LevelTestPagePO(page)
    await levelTest.navigate()

    await levelTest.childNameInput.fill('김아이')
    await levelTest.startButton.click()

    await expect(page.getByText(quizFixture[0].prompt)).toBeVisible()

    await levelTest.choiceRadio('2').check()
    await page.getByText(quizFixture[1].prompt).locator('..').getByRole('textbox').fill('7')

    let dialogMessage: string | null = null
    page.once('dialog', async (dialog) => {
      dialogMessage = dialog.message()
      await dialog.accept()
    })
    await levelTest.submitButton.click()

    await expect.poll(() => dialogMessage).toBe('제출이 완료되었습니다.')
    await expect(levelTest.resultBanner).toBeVisible()
    await expect(page.getByText('1 / 1점')).toBeVisible()
  })
})

test.describe('레벨테스트 접근 제어', () => {
  test('로그인하지 않으면 로그인 유도 화면으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/level-test')
    await expect(page).toHaveURL(/[?&]login=1/)
  })
})
