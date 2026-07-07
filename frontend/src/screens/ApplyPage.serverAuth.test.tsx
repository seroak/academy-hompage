import ApplyPage from './ApplyPage'

const serverParent = {
  id: 'parent-1',
  email: 'parent@example.com',
  name: '학부모',
}

export const applyPageWithServerParent = <ApplyPage initialParent={serverParent} />
